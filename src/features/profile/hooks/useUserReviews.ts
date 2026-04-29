// src/features/profile/hooks/useUserReviews.ts
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/shared/services/api/api-client'
import type { Review } from '@/entities/review/types'

interface UserReviewsResponse {
  reviews: Review[]
}

export const userReviewsKey = (userId: string) => ['user-reviews', userId] as const

export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: userReviewsKey(userId),
    queryFn: () => apiGet<UserReviewsResponse>(`/users/${userId}/reviews`),
    enabled: !!userId,
  })
}
