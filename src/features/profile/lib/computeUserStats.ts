// src/features/profile/lib/computeUserStats.ts
import type { Review } from '@/entities/review/types'
import type { ContentType, Rating } from '@/shared/types'

export interface UserStats {
  totalReviews: number
  averageRating: number | null        // null si no hay ratings
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>
}

const RATINGS: Rating[] = [1, 2, 3, 4, 5]
const CONTENT_TYPES: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

export function computeUserStats(reviews: Review[]): UserStats {
  const totalReviews = reviews.length

  // Rating distribution
  const ratingDistribution = Object.fromEntries(
    RATINGS.map((r) => [r, 0])
  ) as Record<Rating, number>

  let ratingSum = 0
  let ratingCount = 0

  for (const review of reviews) {
    if (review.rating) {
      ratingDistribution[review.rating]++
      ratingSum += review.rating
      ratingCount++
    }
  }

  const averageRating = ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : null

  // Reviews por content type
  const reviewsByContentType = Object.fromEntries(
    CONTENT_TYPES.map((ct) => [ct, 0])
  ) as Record<ContentType, number>

  for (const review of reviews) {
    reviewsByContentType[review.contentType]++
  }

  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    reviewsByContentType,
  }
}
