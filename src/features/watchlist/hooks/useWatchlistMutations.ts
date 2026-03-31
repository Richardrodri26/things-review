// src/features/watchlist/hooks/useWatchlistMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore, useUser } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { CreateWatchlistItemDTO, UpdateWatchlistItemDTO } from '@/entities/watchlist/types'
import { WATCHLIST_QUERY_KEY } from './useWatchlist'

export interface WatchlistToastMessages {
  added?: string
  addedError?: string
  addedErrorDescription?: string
  updated?: string
  updatedError?: string
  updatedErrorDescription?: string
  removed?: string
  removedError?: string
  removedErrorDescription?: string
  consumed?: string
  consumedDescription?: string
  consumedError?: string
  consumedErrorDescription?: string
}

export function useAddToWatchlist(messages?: WatchlistToastMessages) {
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
      toast.success({ title: messages?.added ?? 'Added to watchlist' })
    },
    onError: () => {
      toast.error({
        title: messages?.addedError ?? 'Could not add to watchlist',
        description: messages?.addedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useUpdateWatchlistItem(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const updateWatchlistItem = useStore((s) => s.updateWatchlistItem)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) =>
      services.watchlist.update(id, data),
    onSuccess: (updated) => {
      updateWatchlistItem(updated.id, updated)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: messages?.updated ?? 'Watchlist item updated' })
    },
    onError: () => {
      toast.error({
        title: messages?.updatedError ?? 'Could not update item',
        description: messages?.updatedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useRemoveFromWatchlist(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const removeWatchlistItem = useStore((s) => s.removeWatchlistItem)

  return useMutation({
    mutationFn: (id: string) => services.watchlist.delete(id),
    onSuccess: (_, id) => {
      removeWatchlistItem(id)
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: messages?.removed ?? 'Removed from watchlist' })
    },
    onError: () => {
      toast.error({
        title: messages?.removedError ?? 'Could not remove item',
        description: messages?.removedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

// Hook conveniente para saber si un item ya fue reviewed
// y ofrecer marcarlo como "consumido" desde la watchlist
export function useConvertWatchlistItemToReview(messages?: WatchlistToastMessages) {
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
        title: messages?.consumed ?? 'Marked as consumed',
        description: messages?.consumedDescription ?? 'A review was created — add your rating and thoughts.',
      })
    },
    onError: () => {
      toast.error({
        title: messages?.consumedError ?? 'Could not mark as consumed',
        description: messages?.consumedErrorDescription ?? 'Please try again.',
      })
    },
  })
}
