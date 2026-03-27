// entities/user/types.ts
import type { ContentType, Rating } from '@/shared/types'

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>
  recentActivity: unknown[] // ReviewWithUser[] — se tipará en review/types.ts
}

export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUserDTO = Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>
