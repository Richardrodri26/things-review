// src/features/reviews/hooks/useReviewMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import { REVIEWS_QUERY_KEY } from './useReviews'

export interface ReviewToastMessages {
  saved?: string
  savedError?: string
  savedErrorDescription?: string
  updated?: string
  updatedError?: string
  updatedErrorDescription?: string
  deleted?: string
  deletedError?: string
  deletedErrorDescription?: string
}

export function useCreateReview(messages?: ReviewToastMessages) {
  const queryClient = useQueryClient()
  const addReview = useStore((s) => s.addReview)

  return useMutation({
    mutationFn: (data: CreateReviewDTO) => services.reviews.create(data),
    onSuccess: (newReview) => {
      addReview(newReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: messages?.saved ?? 'Review saved' })
    },
    onError: () => {
      toast.error({
        title: messages?.savedError ?? 'Could not save review',
        description: messages?.savedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useUpdateReview(messages?: ReviewToastMessages) {
  const queryClient = useQueryClient()
  const updateReview = useStore((s) => s.updateReview)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewDTO }) =>
      services.reviews.update(id, data),
    onSuccess: (updatedReview) => {
      updateReview(updatedReview.id, updatedReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: messages?.updated ?? 'Review updated' })
    },
    onError: () => {
      toast.error({
        title: messages?.updatedError ?? 'Could not update review',
        description: messages?.updatedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useDeleteReview(messages?: ReviewToastMessages) {
  const queryClient = useQueryClient()
  const removeReview = useStore((s) => s.removeReview)

  return useMutation({
    mutationFn: (id: string) => services.reviews.delete(id),
    onSuccess: (_, id) => {
      removeReview(id)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: messages?.deleted ?? 'Review deleted' })
    },
    onError: () => {
      toast.error({
        title: messages?.deletedError ?? 'Could not delete review',
        description: messages?.deletedErrorDescription ?? 'Please try again.',
      })
    },
  })
}
