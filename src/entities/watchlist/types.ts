// entities/watchlist/types.ts
import type { ContentType } from '@/shared/types'
import type { User } from '@/entities/user/types'

export type WatchlistPriority = 'low' | 'medium' | 'high'

export interface WatchlistItem {
  id: string
  userId: string
  contentId: string
  contentType: ContentType
  priority: WatchlistPriority
  note?: string
  // Fecha en que se quiere consumir (opcional)
  targetDate?: Date
  addedAt: Date
  updatedAt: Date
}

export interface WatchlistItemWithUser extends WatchlistItem {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export type CreateWatchlistItemDTO = Omit<WatchlistItem, 'id' | 'addedAt' | 'updatedAt'>
export type UpdateWatchlistItemDTO = Partial<
  Pick<WatchlistItem, 'priority' | 'note' | 'targetDate'>
>

// Para estadísticas
export interface WatchlistStats {
  total: number
  byContentType: Record<ContentType, number>
  byPriority: Record<WatchlistPriority, number>
  overdueCount: number // items con targetDate pasada
}
