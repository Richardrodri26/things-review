// src/features/reviews/hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'

export const REVIEWS_QUERY_KEY = ['reviews'] as const

export function useReviews() {
  const user = useUser()

  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return services.reviews.getByUserId(user.id)
    },
    enabled: !!user?.id,
  })
}

export function useReviewsByContent(contentId: string) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'content', contentId],
    queryFn: () => services.reviews.getByContentId(contentId),
    enabled: !!contentId,
  })
}
