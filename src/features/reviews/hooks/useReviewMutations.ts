// src/features/reviews/hooks/useReviewMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import { REVIEWS_QUERY_KEY } from './useReviews'

export function useCreateReview() {
  const queryClient = useQueryClient()
  const addReview = useStore((s) => s.addReview)

  return useMutation({
    mutationFn: (data: CreateReviewDTO) => services.reviews.create(data),
    onSuccess: (newReview) => {
      addReview(newReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: 'Review saved' })
    },
    onError: () => {
      toast.error({ title: 'Could not save review', description: 'Please try again.' })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  const updateReview = useStore((s) => s.updateReview)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewDTO }) =>
      services.reviews.update(id, data),
    onSuccess: (updatedReview) => {
      updateReview(updatedReview.id, updatedReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: 'Review updated' })
    },
    onError: () => {
      toast.error({ title: 'Could not update review', description: 'Please try again.' })
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  const removeReview = useStore((s) => s.removeReview)

  return useMutation({
    mutationFn: (id: string) => services.reviews.delete(id),
    onSuccess: (_, id) => {
      removeReview(id)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
      toast.success({ title: 'Review deleted' })
    },
    onError: () => {
      toast.error({ title: 'Could not delete review', description: 'Please try again.' })
    },
  })
}
