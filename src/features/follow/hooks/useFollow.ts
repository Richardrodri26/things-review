import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/shared/services/api/api-client'
import type { UserPublicProfile, FollowStatus } from '@/entities/follow/types'

// ─── Query keys ──────────────────────────────────────────────────────────────

export const userProfileKey = (userId: string) => ['user-profile', userId] as const
export const followersKey = (userId: string) => ['followers', userId] as const
export const followingKey = (userId: string) => ['following', userId] as const

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userProfileKey(userId),
    queryFn: () => apiGet<UserPublicProfile>(`/users/${userId}`),
    enabled: !!userId,
  })
}

export function useFollowStatus(userId: string) {
  const { data: profile } = useUserProfile(userId)
  return {
    isFollowing: profile?.isFollowing ?? false,
    followerCount: profile?.followerCount ?? 0,
    followingCount: profile?.followingCount ?? 0,
  } satisfies FollowStatus
}

export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient()
  const key = userProfileKey(userId)

  return useMutation({
    mutationFn: () => apiPost<{ isFollowing: boolean; followerCount: number }>(`/users/${userId}/follow`, {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<UserPublicProfile>(key)

      queryClient.setQueryData<UserPublicProfile>(key, (old) => {
        if (!old) return old
        return {
          ...old,
          isFollowing: !old.isFollowing,
          followerCount: old.isFollowing ? old.followerCount - 1 : old.followerCount + 1,
        }
      })

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useFollowers(userId: string, page = 1) {
  return useQuery({
    queryKey: [...followersKey(userId), page],
    queryFn: () => apiGet<{ users: UserPublicProfile[]; total: number; hasMore: boolean }>(
      `/users/${userId}/followers`,
      { page: String(page) }
    ),
    enabled: !!userId,
  })
}

export function useFollowing(userId: string, page = 1) {
  return useQuery({
    queryKey: [...followingKey(userId), page],
    queryFn: () => apiGet<{ users: UserPublicProfile[]; total: number; hasMore: boolean }>(
      `/users/${userId}/following`,
      { page: String(page) }
    ),
    enabled: !!userId,
  })
}
