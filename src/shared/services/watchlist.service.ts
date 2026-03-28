// shared/services/watchlist.service.ts
import type {
  WatchlistItem,
  WatchlistStats,
  CreateWatchlistItemDTO,
  UpdateWatchlistItemDTO,
} from '@/entities/watchlist/types'
import type { ContentType } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

const WATCHLIST_KEY = `${STORAGE_KEYS.USER}:watchlist` as const

export interface IWatchlistService {
  getAll(): Promise<WatchlistItem[]>
  getById(id: string): Promise<WatchlistItem | null>
  getByUserId(userId: string): Promise<WatchlistItem[]>
  create(data: CreateWatchlistItemDTO): Promise<WatchlistItem>
  update(id: string, data: UpdateWatchlistItemDTO): Promise<WatchlistItem>
  delete(id: string): Promise<void>
  deleteByContentId(userId: string, contentId: string): Promise<void>
  isInWatchlist(userId: string, contentId: string): Promise<boolean>
  getStats(userId: string): Promise<WatchlistStats>
}

export class LocalWatchlistService implements IWatchlistService {
  private readAll(): WatchlistItem[] {
    return getFromStorage<WatchlistItem[]>(WATCHLIST_KEY, [])
  }

  private writeAll(items: WatchlistItem[]): void {
    setToStorage(WATCHLIST_KEY, items)
  }

  async getAll(): Promise<WatchlistItem[]> {
    return this.readAll()
  }

  async getById(id: string): Promise<WatchlistItem | null> {
    return this.readAll().find((i) => i.id === id) ?? null
  }

  async getByUserId(userId: string): Promise<WatchlistItem[]> {
    return this.readAll()
      .filter((i) => i.userId === userId)
      .sort((a, b) => {
        // Ordenar por prioridad: high > medium > low, luego por addedAt desc
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (pDiff !== 0) return pDiff
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      })
  }

  async create(data: CreateWatchlistItemDTO): Promise<WatchlistItem> {
    const all = this.readAll()

    // Chequear duplicado
    const exists = all.find(
      (i) => i.userId === data.userId && i.contentId === data.contentId
    )
    if (exists) {
      throw new Error('Item already in watchlist')
    }

    const item: WatchlistItem = {
      ...data,
      id: generateId(),
      addedAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeAll([...all, item])
    return item
  }

  async update(id: string, data: UpdateWatchlistItemDTO): Promise<WatchlistItem> {
    const all = this.readAll()
    const idx = all.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Watchlist item not found: ${id}`)
    const updated: WatchlistItem = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((i) => i.id !== id))
  }

  async deleteByContentId(userId: string, contentId: string): Promise<void> {
    this.writeAll(
      this.readAll().filter(
        (i) => !(i.userId === userId && i.contentId === contentId)
      )
    )
  }

  async isInWatchlist(userId: string, contentId: string): Promise<boolean> {
    return this.readAll().some(
      (i) => i.userId === userId && i.contentId === contentId
    )
  }

  async getStats(userId: string): Promise<WatchlistStats> {
    const items = await this.getByUserId(userId)
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

    return {
      total: items.length,
      byContentType,
      byPriority,
      overdueCount,
    }
  }
}
