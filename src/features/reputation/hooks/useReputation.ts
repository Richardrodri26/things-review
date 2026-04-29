import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/shared/services/api/api-client'
import type { ReputationData } from '@/entities/reputation/types'

export const reputationKey = (userId: string) => ['reputation', userId] as const

export function useReputation(userId: string | undefined) {
  return useQuery({
    queryKey: reputationKey(userId ?? ''),
    queryFn: () => apiGet<ReputationData>(`/users/${userId}/reputation`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
