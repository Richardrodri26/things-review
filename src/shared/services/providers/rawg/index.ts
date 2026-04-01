import type { ContentType, Genre } from '@/shared/types'
import type { ContentProvider, ProviderItemDetail, ProviderSearchResult } from '../types'

const BASE_URL = 'https://api.rawg.io/api'

interface RAWGGame {
  id: number
  name: string
  released: string | null
  background_image: string | null
  rating: number
  genres: Array<{ id: number; name: string }>
  description_raw?: string
  short_description?: string
}

interface RAWGSearchResponse {
  results: RAWGGame[]
  count: number
}

function mapGenre(g: { id: number; name: string }): Genre {
  return { id: String(g.id), name: g.name, applicableTo: ['game'] }
}

export class RAWGProvider implements ContentProvider {
  readonly id = 'rawg'
  readonly displayName = 'RAWG'
  readonly logoUrl = 'https://rawg.io/assets/images/rawg.png'
  readonly supportedContentTypes: ContentType[] = ['game']

  private readonly apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.RAWG_API_KEY ?? ''
  }

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    if (!this.apiKey || contentType !== 'game') return []

    const url = `${BASE_URL}/games?key=${this.apiKey}&search=${encodeURIComponent(query)}&page_size=10`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return []

    const data = (await res.json()) as RAWGSearchResponse
    return data.results.map((item) => ({
      externalId: String(item.id),
      providerId: this.id,
      contentType: 'game',
      title: item.name,
      year: item.released ? new Date(item.released).getFullYear() : undefined,
      coverImageUrl: item.background_image ?? undefined,
      overview: undefined,
    }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    if (!this.apiKey || contentType !== 'game') return null

    const res = await fetch(`${BASE_URL}/games/${externalId}?key=${this.apiKey}`, { next: { revalidate: 0 } })
    if (!res.ok) return null

    const data = (await res.json()) as RAWGGame
    return {
      externalId: String(data.id),
      providerId: this.id,
      contentType: 'game',
      title: data.name,
      year: data.released ? new Date(data.released).getFullYear() : undefined,
      coverImageUrl: data.background_image ?? undefined,
      overview: data.description_raw?.slice(0, 500) ?? undefined,
      genres: (data.genres ?? []).map(mapGenre),
      extra: data as unknown as Record<string, unknown>,
    }
  }
}
