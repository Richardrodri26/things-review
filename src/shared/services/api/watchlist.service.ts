import type {
  WatchlistItem,
  WatchlistStats,
  CreateWatchlistItemDTO,
  UpdateWatchlistItemDTO,
} from '@/entities/watchlist/types'
import type { ContentType } from '@/shared/types'
import type { IWatchlistService } from '../watchlist.service'
import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'

export class ApiWatchlistService implements IWatchlistService {
  async getAll(): Promise<WatchlistItem[]> {
    return apiGet<WatchlistItem[]>('/watchlist')
  }

  async getById(id: string): Promise<WatchlistItem | null> {
    const all = await this.getAll()
    return all.find((i) => i.id === id) ?? null
  }

  async getByUserId(_userId: string): Promise<WatchlistItem[]> {
    // El backend filtra por usuario autenticado
    return this.getAll()
  }

  async create(data: CreateWatchlistItemDTO): Promise<WatchlistItem> {
    return apiPost<WatchlistItem>('/watchlist', data)
  }

  async update(id: string, data: UpdateWatchlistItemDTO): Promise<WatchlistItem> {
    return apiPatch<WatchlistItem>(`/watchlist/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiDelete(`/watchlist/${id}`)
  }

  async deleteByContentId(_userId: string, contentId: string): Promise<void> {
    const all = await this.getAll()
    const item = all.find((i) => i.contentId === contentId)
    if (item) await this.delete(item.id)
  }

  async isInWatchlist(_userId: string, contentId: string): Promise<boolean> {
    const all = await this.getAll()
    return all.some((i) => i.contentId === contentId)
  }

  async getStats(_userId: string): Promise<WatchlistStats> {
    const items = await this.getAll()
    const now = new Date()

    const byContentType = {
      movie: 0, series: 0, music: 0, game: 0, book: 0, podcast: 0,
    } as Record<ContentType, number>

    const byPriority = { high: 0, medium: 0, low: 0 }
    let overdueCount = 0

    for (const item of items) {
      byContentType[item.contentType]++
      byPriority[item.priority]++
      if (item.targetDate && new Date(item.targetDate) < now) {
        overdueCount++
      }
    }

    return { total: items.length, byContentType, byPriority, overdueCount }
  }
}
