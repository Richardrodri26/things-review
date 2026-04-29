import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/shared/services/api/api-client'

interface GlobalRating {
  averageRating: number | null
  totalReviews: number
  ratingDistribution: Record<string, number>
}

export function useGlobalRating(catalogItemId: string | undefined) {
  return useQuery({
    queryKey: ['global-rating', catalogItemId],
    queryFn: () => apiGet<GlobalRating>(`/catalog/${catalogItemId}/rating`),
    enabled: !!catalogItemId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
