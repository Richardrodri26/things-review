import type { ICatalogService, CatalogItem } from '../catalog.service'
import { apiGet } from './api-client'

// Shape que retorna el API (subconjunto flat de CatalogItem)
interface CatalogItemRecord {
  id: string
  contentType: string
  title: string
  coverImageUrl: string | null
  backdropImageUrl: string | null
  year: number | null
  metadata: Record<string, unknown> | null
}

function toAppItem(record: CatalogItemRecord): CatalogItem {
  return {
    id: record.id,
    contentType: record.contentType,
    title: record.title,
    coverImageUrl: record.coverImageUrl ?? undefined,
    backdropImageUrl: record.backdropImageUrl ?? undefined,
    year: record.year ?? undefined,
    createdAt: new Date(),
    providerId: 'db',
    ...(record.metadata ?? {}),
  } as unknown as CatalogItem
}

export class ApiCatalogService implements ICatalogService {
  async getByType(contentType: CatalogItem['contentType']): Promise<CatalogItem[]> {
    const records = await apiGet<CatalogItemRecord[]>('/catalog/items', { type: contentType })
    return records.map(toAppItem)
  }

  async getMovies() { return this.getByType('movie') as Promise<import('@/entities/movie/types').Movie[]> }
  async getMovieById(id: string) {
    const all = await this.getByType('movie')
    return (all.find((m) => m.id === id) ?? null) as import('@/entities/movie/types').Movie | null
  }

  async getSeries() { return this.getByType('series') as Promise<import('@/entities/series/types').Series[]> }
  async getSeriesById(id: string) {
    const all = await this.getByType('series')
    return (all.find((s) => s.id === id) ?? null) as import('@/entities/series/types').Series | null
  }

  async getMusic() { return this.getByType('music') as Promise<import('@/entities/music/types').MusicAlbum[]> }
  async getGames() { return this.getByType('game') as Promise<import('@/entities/game/types').Game[]> }
  async getBooks() { return this.getByType('book') as Promise<import('@/entities/book/types').Book[]> }
  async getPodcasts() { return this.getByType('podcast') as Promise<import('@/entities/podcast/types').Podcast[]> }

  async search(query: string): Promise<CatalogItem[]> {
    const types: CatalogItem['contentType'][] = ['movie', 'series', 'music', 'game', 'book', 'podcast']
    const all = (await Promise.all(types.map((t) => this.getByType(t)))).flat()
    const q = query.toLowerCase()
    return all.filter((item) => item.title.toLowerCase().includes(q))
  }

  async addItem(_data: import('../catalog.service').AddItemDTO): Promise<CatalogItem> {
    throw new Error('Adding catalog items directly is not supported. Use the admin panel.')
  }
}
