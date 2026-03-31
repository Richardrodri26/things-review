// src/features/groups/hooks/useGroups.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser, useGroups as useGroupsStore } from '@/shared/lib/store'
import { useStore } from '@/shared/lib/store'
import { apiGet } from '@/shared/services/api/api-client'
import type { ReviewWithUser } from '@/entities/review/types'

export const GROUPS_QUERY_KEY = ['groups'] as const

export function useGroups() {
  const user = useUser()
  const groups = useGroupsStore()
  const setGroups = useStore((s) => s.setGroups)

  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: async () => {
      const all = await services.groups.getAll()
      setGroups(all)
      return all
    },
    enabled: !!user,
    initialData: groups.length > 0 ? groups : undefined,
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: [...GROUPS_QUERY_KEY, id] as const,
    queryFn: () => services.groups.getById(id),
    enabled: !!id,
  })
}

export function useGroupReviews(groupId: string) {
  return useQuery({
    queryKey: [...GROUPS_QUERY_KEY, groupId, 'reviews'] as const,
    queryFn: () => apiGet<ReviewWithUser[]>(`/groups/${groupId}/reviews`),
    enabled: !!groupId,
  })
}
