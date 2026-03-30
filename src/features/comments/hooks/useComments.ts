// src/features/comments/hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { toast } from '@/shared/lib/toast'
import type { CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'

export const COMMENTS_QUERY_KEY = ['comments'] as const

export function useComments(reviewId: string) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, reviewId],
    queryFn: () => services.comments.getByReviewId(reviewId),
    enabled: !!reviewId,
  })
}

export function useCreateComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentDTO) => services.comments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({ title: 'Could not post comment', description: 'Please try again.' })
    },
  })
}

export function useUpdateComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDTO }) =>
      services.comments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({ title: 'Could not update comment', description: 'Please try again.' })
    },
  })
}

export function useDeleteComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({ title: 'Could not delete comment', description: 'Please try again.' })
    },
  })
}
