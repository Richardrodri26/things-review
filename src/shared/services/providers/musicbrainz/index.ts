import type { ContentType, Genre } from '@/shared/types'
import type { ContentProvider, ProviderItemDetail, ProviderSearchResult } from '../types'

// No API key required. Must include User-Agent header. Rate limit: 1 req/sec.
const BASE_URL = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'ThingsReview/1.0 (https://github.com/things-review)'

interface MBReleaseGroup {
  id: string
  title: string
  'first-release-date'?: string
  'primary-type'?: string
  'artist-credit'?: Array<{ name: string }>
  tags?: Array<{ name: string; count: number }>
  releases?: Array<{ id: string }>
}

interface MBSearchResponse {
  'release-groups': MBReleaseGroup[]
  count: number
}

interface MBReleaseGroupDetail extends MBReleaseGroup {
  annotation?: string
  genres?: Array<{ name: string; count: number }>
}

const headers = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json',
}

function extractYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined
  const year = parseInt(dateStr.slice(0, 4), 10)
  return isNaN(year) ? undefined : year
}

function mapGenre(name: string): Genre {
  return { id: name, name, applicableTo: ['music'] }
}

export class MusicBrainzProvider implements ContentProvider {
  readonly id = 'musicbrainz'
  readonly displayName = 'MusicBrainz'
  readonly logoUrl = 'https://musicbrainz.org/static/images/MusicBrainz_logo.svg'
  readonly supportedContentTypes: ContentType[] = ['music']
  readonly timeout = 10_000

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    if (contentType !== 'music') return []

    const url = `${BASE_URL}/release-group?query=${encodeURIComponent(query)}&type=album|ep|single&limit=10&fmt=json`
    const res = await fetch(url, { headers, next: { revalidate: 0 } })
    if (!res.ok) return []

    const data = (await res.json()) as MBSearchResponse
    return (data['release-groups'] ?? []).map((item) => ({
      externalId: item.id,
      providerId: this.id,
      contentType: 'music',
      title: item.title,
      year: extractYear(item['first-release-date']),
      coverImageUrl: undefined, // MusicBrainz doesn't serve cover art directly
      overview: item['artist-credit']?.[0]?.name
        ? `by ${item['artist-credit'][0].name}`
        : undefined,
    }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    if (contentType !== 'music') return null

    const url = `${BASE_URL}/release-group/${externalId}?inc=genres+tags+artist-credits&fmt=json`
    const res = await fetch(url, { headers, next: { revalidate: 0 } })
    if (!res.ok) return null

    const data = (await res.json()) as MBReleaseGroupDetail
    const genres: Genre[] = (data.genres ?? data.tags ?? [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((g) => mapGenre(g.name))

    return {
      externalId: data.id,
      providerId: this.id,
      contentType: 'music',
      title: data.title,
      year: extractYear(data['first-release-date']),
      coverImageUrl: undefined,
      overview: data['artist-credit']?.[0]?.name
        ? `by ${data['artist-credit'][0].name}`
        : undefined,
      genres,
      extra: data as unknown as Record<string, unknown>,
    }
  }
}
