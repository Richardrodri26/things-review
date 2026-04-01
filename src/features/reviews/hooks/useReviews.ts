// src/features/reviews/hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useSession } from '@/lib/auth-client'

export const REVIEWS_QUERY_KEY = ['reviews'] as const

export function useReviews() {
  // Use the session directly instead of the Zustand store to avoid a race condition
  // where the store's user is populated asynchronously via useEffect after first render.
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return []
      return services.reviews.getByUserId(userId)
    },
    enabled: !!userId,
  })
}

export function useReviewsByContent(contentId: string) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'content', contentId],
    queryFn: () => services.reviews.getByContentId(contentId),
    enabled: !!contentId,
  })
}

export function useReviewById(id: string) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'detail', id],
    queryFn: () => services.reviews.getById(id),
    enabled: !!id,
  })
}
