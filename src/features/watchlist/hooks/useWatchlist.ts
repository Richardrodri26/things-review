// src/features/watchlist/hooks/useWatchlist.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'

export const WATCHLIST_QUERY_KEY = ['watchlist'] as const

export function useWatchlistItems() {
  const user = useUser()

  return useQuery({
    queryKey: [...WATCHLIST_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return services.watchlist.getByUserId(user.id)
    },
    enabled: !!user?.id,
  })
}

export function useWatchlistStats() {
  const user = useUser()

  return useQuery({
    queryKey: [...WATCHLIST_QUERY_KEY, 'stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return services.watchlist.getStats(user.id)
    },
    enabled: !!user?.id,
  })
}

export function useIsInWatchlist(contentId: string) {
  const user = useUser()

  return useQuery({
    queryKey: [...WATCHLIST_QUERY_KEY, 'check', user?.id, contentId],
    queryFn: async () => {
      if (!user?.id || !contentId) return false
      return services.watchlist.isInWatchlist(user.id, contentId)
    },
    enabled: !!user?.id && !!contentId,
  })
}
