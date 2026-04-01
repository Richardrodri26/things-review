import type { ContentType, Genre } from '@/shared/types'
import type { ContentProvider, ProviderItemDetail, ProviderSearchResult } from '../types'

// No API key required. Rate limit: ~20 calls/min.
const BASE_URL = 'https://itunes.apple.com'

interface ITunesResult {
  collectionId?: number
  trackId?: number
  collectionName?: string
  trackName?: string
  artistName?: string
  collectionViewUrl?: string
  artworkUrl100?: string
  artworkUrl600?: string
  releaseDate?: string
  primaryGenreName?: string
  description?: string
  longDescription?: string
  feedUrl?: string
  // Podcast-specific
  collectionType?: string
  kind?: string
}

interface ITunesSearchResponse {
  resultCount: number
  results: ITunesResult[]
}

function resolveId(item: ITunesResult): string {
  return String(item.collectionId ?? item.trackId ?? '')
}

function resolveTitle(item: ITunesResult): string {
  return item.collectionName ?? item.trackName ?? ''
}

function resolveArtwork(item: ITunesResult): string | undefined {
  // Replace 100x100 with 600x600 for better quality
  return (item.artworkUrl600 ?? item.artworkUrl100)?.replace('100x100', '600x600')
}

function resolveYear(item: ITunesResult): number | undefined {
  if (!item.releaseDate) return undefined
  const year = new Date(item.releaseDate).getFullYear()
  return isNaN(year) ? undefined : year
}

function mapGenre(name?: string, contentType?: ContentType): Genre {
  const genreName = name ?? 'Unknown'
  return { id: genreName, name: genreName, applicableTo: contentType ? [contentType] : ['podcast', 'music'] }
}

export class ItunesProvider implements ContentProvider {
  readonly id = 'itunes'
  readonly displayName = 'Apple iTunes'
  readonly logoUrl = 'https://www.apple.com/favicon.ico'
  readonly supportedContentTypes: ContentType[] = ['podcast', 'music']

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    if (contentType !== 'podcast' && contentType !== 'music') return []

    const entity = contentType === 'podcast' ? 'podcast' : 'album'
    const url = `${BASE_URL}/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=10`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []

    const data = (await res.json()) as ITunesSearchResponse
    return data.results
      .filter((item) => resolveId(item) !== '')
      .map((item) => ({
        externalId: resolveId(item),
        providerId: this.id,
        contentType,
        title: resolveTitle(item),
        year: resolveYear(item),
        coverImageUrl: resolveArtwork(item),
        overview: item.artistName ? `by ${item.artistName}` : undefined,
      }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    if (contentType !== 'podcast' && contentType !== 'music') return null

    const url = `${BASE_URL}/lookup?id=${externalId}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null

    const data = (await res.json()) as ITunesSearchResponse
    const item = data.results?.[0]
    if (!item) return null

    return {
      externalId,
      providerId: this.id,
      contentType,
      title: resolveTitle(item),
      year: resolveYear(item),
      coverImageUrl: resolveArtwork(item),
      overview: item.description?.slice(0, 500) ?? item.longDescription?.slice(0, 500) ?? undefined,
      genres: [mapGenre(item.primaryGenreName, contentType)],
      extra: item as unknown as Record<string, unknown>,
    }
  }
}
