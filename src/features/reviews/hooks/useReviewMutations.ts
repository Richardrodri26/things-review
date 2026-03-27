// src/features/reviews/hooks/useReviewMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
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
    },
  })
}
