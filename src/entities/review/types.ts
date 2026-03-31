// entities/review/types.ts
import type {
  ContentType,
  ConsumptionStatus,
  Rating,
} from '@/shared/types'
import type { User } from '@/entities/user/types'
import type { GamePlatform } from '@/entities/game/types'
import type { OutputData } from '@editorjs/editorjs'

export interface SeriesReviewMetadata {
  contentType: 'series'
  currentSeason?: number
  currentEpisode?: number
  seasonRatings?: Record<number, Rating>
}

export interface GameReviewMetadata {
  contentType: 'game'
  platform?: GamePlatform
  hoursPlayed?: number
  completionPercent?: number
  difficulty?: 'easy' | 'normal' | 'hard' | 'very_hard'
}

export interface BookReviewMetadata {
  contentType: 'book'
  currentPage?: number
  readingFormat?: 'physical' | 'ebook' | 'audiobook'
}

export interface PodcastReviewMetadata {
  contentType: 'podcast'
  episodesListened?: number
}

export type ReviewMetadata =
  | SeriesReviewMetadata
  | GameReviewMetadata
  | BookReviewMetadata
  | PodcastReviewMetadata
  | null

export interface CatalogItemSnapshot {
  id: string
  title: string
  coverImageUrl: string | null
  backdropImageUrl: string | null
  contentType: string
  year: number | null
}

export interface Review {
  id: string
  userId: string
  contentId: string
  contentType: ContentType
  rating?: Rating
  title?: string
  body?: OutputData
  containsSpoilers: boolean
  status: ConsumptionStatus
  metadata?: ReviewMetadata
  consumedAt?: Date
  catalogItem?: CatalogItemSnapshot | null
  createdAt: Date
  updatedAt: Date
}

export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export type CreateReviewDTO = Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateReviewDTO = Partial<Pick<Review,
  'rating' | 'title' | 'body' | 'containsSpoilers' | 'status' | 'consumedAt' | 'metadata'
>>
