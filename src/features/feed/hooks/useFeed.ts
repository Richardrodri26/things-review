import { useInfiniteQuery } from '@tanstack/react-query'
import { apiGet } from '@/shared/services/api/api-client'
import type { ContentType } from '@/shared/types'

interface FeedPage {
  reviews: unknown[]
  total: number
  page: number
  hasMore: boolean
}

interface GlobalReviewsFilters {
  contentType?: ContentType | 'all'
  sort?: 'recent' | 'popular' | 'rating_high' | 'rating_low'
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'] as const,
    queryFn: ({ pageParam }) =>
      apiGet<FeedPage>('/feed', { page: String(pageParam), limit: '20' }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useGlobalReviews(filters?: GlobalReviewsFilters) {
  const contentType = filters?.contentType === 'all' ? undefined : filters?.contentType
  const sort = filters?.sort

  return useInfiniteQuery({
    queryKey: ['global-reviews', contentType, sort] as const,
    queryFn: ({ pageParam }) =>
      apiGet<FeedPage>('/reviews/global', {
        page: String(pageParam),
        limit: '20',
        ...(contentType && { contentType }),
        ...(sort && { sort }),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 2 * 60 * 1000,
  })
}
