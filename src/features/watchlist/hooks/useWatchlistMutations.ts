// src/features/watchlist/hooks/useWatchlistMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useThrottler } from '@tanstack/react-pacer'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'
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

const THROTTLE_MS = 1000

export function useAddToWatchlist(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  const mutation = useMutation({
    mutationFn: (data: Omit<CreateWatchlistItemDTO, 'userId'>) => {
      if (!user?.id) throw new Error('User not authenticated')
      return services.watchlist.create({ ...data, userId: user.id })
    },
    onSuccess: () => {
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

  const throttler = useThrottler(
    (data: Omit<CreateWatchlistItemDTO, 'userId'>) => mutation.mutate(data),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (data: Omit<CreateWatchlistItemDTO, 'userId'>) => throttler.maybeExecute(data),
  }
}

export function useUpdateWatchlistItem(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) =>
      services.watchlist.update(id, data),
    onSuccess: () => {
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

  const throttler = useThrottler(
    ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) => mutation.mutate({ id, data }),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (args: { id: string; data: UpdateWatchlistItemDTO }) => throttler.maybeExecute(args),
  }
}

export function useRemoveFromWatchlist(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => services.watchlist.delete(id),
    onSuccess: () => {
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

  const throttler = useThrottler(
    (id: string) => mutation.mutate(id),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (id: string) => throttler.maybeExecute(id),
  }
}

export function useConvertWatchlistItemToReview(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  const mutation = useMutation({
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

      const review = await services.reviews.create({
        userId: user.id,
        contentId,
        contentType: contentType as never,
        containsSpoilers: false,
        status: 'consumed',
      })

      await services.watchlist.delete(watchlistItemId)

      return review
    },
    onSuccess: () => {
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

  const throttler = useThrottler(
    (args: { watchlistItemId: string; contentId: string; contentType: string }) =>
      mutation.mutate(args),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (args: { watchlistItemId: string; contentId: string; contentType: string }) =>
      throttler.maybeExecute(args),
  }
}
