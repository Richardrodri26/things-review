// src/features/watchlist/hooks/useWatchlistMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore, useUser } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { CreateWatchlistItemDTO, UpdateWatchlistItemDTO } from '@/entities/watchlist/types'
import { WATCHLIST_QUERY_KEY } from './useWatchlist'

export function useAddToWatchlist() {
  const queryClient = useQueryClient()
  const addWatchlistItem = useStore((s) => s.addWatchlistItem)
  const user = useUser()

  return useMutation({
    mutationFn: (data: Omit<CreateWatchlistItemDTO, 'userId'>) => {
      if (!user?.id) throw new Error('User not authenticated')
      return services.watchlist.create({ ...data, userId: user.id })
    },
    onSuccess: (newItem) => {
      addWatchlistItem(newItem)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: 'Added to watchlist' })
    },
    onError: () => {
      toast.error({ title: 'Could not add to watchlist', description: 'Please try again.' })
    },
  })
}

export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient()
  const updateWatchlistItem = useStore((s) => s.updateWatchlistItem)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) =>
      services.watchlist.update(id, data),
    onSuccess: (updated) => {
      updateWatchlistItem(updated.id, updated)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: 'Watchlist item updated' })
    },
    onError: () => {
      toast.error({ title: 'Could not update item', description: 'Please try again.' })
    },
  })
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient()
  const removeWatchlistItem = useStore((s) => s.removeWatchlistItem)

  return useMutation({
    mutationFn: (id: string) => services.watchlist.delete(id),
    onSuccess: (_, id) => {
      removeWatchlistItem(id)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: 'Removed from watchlist' })
    },
    onError: () => {
      toast.error({ title: 'Could not remove item', description: 'Please try again.' })
    },
  })
}

// Hook conveniente para saber si un item ya fue reviewed
// y ofrecer marcarlo como "consumido" desde la watchlist
export function useConvertWatchlistItemToReview() {
  const queryClient = useQueryClient()
  const removeWatchlistItem = useStore((s) => s.removeWatchlistItem)
  const user = useUser()

  return useMutation({
    mutationFn: async ({
      watchlistItemId,
      contentId,
      contentType,
    }: {
      watchlistItemId: string
      contentId: string
      contentType: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Crear el review básico
      const review = await services.reviews.create({
        userId: user.id,
        contentId,
        contentType: contentType as never,
        containsSpoilers: false,
        status: 'consumed',
      })

      // Eliminar de watchlist
      await services.watchlist.delete(watchlistItemId)

      return review
    },
    onSuccess: (_, { watchlistItemId }) => {
      removeWatchlistItem(watchlistItemId)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success({
        title: 'Marked as consumed',
        description: 'A review was created — add your rating and thoughts.',
      })
    },
    onError: () => {
      toast.error({ title: 'Could not mark as consumed', description: 'Please try again.' })
    },
  })
}
