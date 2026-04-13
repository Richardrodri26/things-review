// src/features/groups/hooks/useGroups.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'
import { apiGet } from '@/shared/services/api/api-client'
import type { ReviewWithUser } from '@/entities/review/types'
import type { GroupRole } from '@/shared/types'

export interface GroupMember {
  userId: string
  groupId: string
  role: GroupRole
  joinedAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}

export const GROUPS_QUERY_KEY = ['groups'] as const

export function useGroups() {
  const user = useUser()

  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => services.groups.getAll(),
    enabled: !!user,
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

export function useGroupReviewsByContent(groupId: string, contentId: string) {
  return useQuery({
    queryKey: [...GROUPS_QUERY_KEY, groupId, 'reviews', 'content', contentId] as const,
    queryFn: () =>
      apiGet<ReviewWithUser[]>(`/groups/${groupId}/reviews`, { contentId }),
    enabled: !!groupId && !!contentId,
  })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: [...GROUPS_QUERY_KEY, groupId, 'members'] as const,
    queryFn: async () => {
      const raw = await apiGet<Array<{
        userId: string
        groupId: string
        role: string
        joinedAt: string
        user: { id: string; username: string | null; displayName: string | null; image: string | null }
      }>>(`/groups/${groupId}/members`)
      return raw.map((m): GroupMember => ({
        userId: m.userId,
        groupId: m.groupId,
        role: m.role as GroupRole,
        joinedAt: m.joinedAt,
        user: {
          id: m.user.id,
          username: m.user.username ?? '',
          displayName: m.user.displayName ?? m.user.username ?? '',
          avatarUrl: m.user.image ?? undefined,
        },
      }))
    },
    enabled: !!groupId,
  })
}
