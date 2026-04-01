import type { ContentType, Genre } from '@/shared/types'
import type { ContentProvider, ProviderItemDetail, ProviderSearchResult } from '../types'

// No API key required.
const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org/b'

interface OLSearchDoc {
  key: string           // e.g. "/works/OL1234W"
  title: string
  first_publish_year?: number
  cover_i?: number
  subject?: string[]
  author_name?: string[]
  description?: string
}

interface OLSearchResponse {
  docs: OLSearchDoc[]
  numFound: number
}

interface OLWorkDetail {
  key: string
  title: string
  description?: string | { value: string }
  subjects?: string[]
  covers?: number[]
  created?: { value: string }
}

function coverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${COVERS_URL}/id/${coverId}-${size}.jpg`
}

function mapSubjectToGenre(subject: string): Genre {
  return { id: subject, name: subject, applicableTo: ['book'] }
}

function extractDescription(raw?: string | { value: string }): string | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') return raw.slice(0, 500)
  return raw.value?.slice(0, 500)
}

export class OpenLibraryProvider implements ContentProvider {
  readonly id = 'openlibrary'
  readonly displayName = 'Open Library'
  readonly logoUrl = 'https://openlibrary.org/images/openlibrary-logo-tighter.svg'
  readonly supportedContentTypes: ContentType[] = ['book']
  readonly timeout = 12_000 // OpenLibrary is a community API — can be slow

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    if (contentType !== 'book') return []

    const url = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&fields=key,title,first_publish_year,cover_i,subject,author_name&limit=10`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []

    const data = (await res.json()) as OLSearchResponse
    return (data.docs ?? []).map((doc) => ({
      externalId: doc.key.replace('/works/', ''),
      providerId: this.id,
      contentType: 'book',
      title: doc.title,
      year: doc.first_publish_year,
      coverImageUrl: doc.cover_i ? coverUrl(doc.cover_i) : undefined,
      overview: doc.author_name?.length
        ? `by ${doc.author_name.slice(0, 2).join(', ')}`
        : undefined,
    }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    if (contentType !== 'book') return null

    const res = await fetch(`${BASE_URL}/works/${externalId}.json`, { next: { revalidate: 0 } })
    if (!res.ok) return null

    const data = (await res.json()) as OLWorkDetail
    const genres: Genre[] = (data.subjects ?? []).slice(0, 5).map(mapSubjectToGenre)
    const coverId = data.covers?.[0]

    return {
      externalId,
      providerId: this.id,
      contentType: 'book',
      title: data.title,
      year: data.created ? new Date(data.created.value).getFullYear() : undefined,
      coverImageUrl: coverId ? coverUrl(coverId, 'L') : undefined,
      overview: extractDescription(data.description),
      genres,
      extra: data as unknown as Record<string, unknown>,
    }
  }
}
