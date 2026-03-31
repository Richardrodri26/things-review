// src/features/comments/hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { toast } from '@/shared/lib/toast'
import type { CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'

export const COMMENTS_QUERY_KEY = ['comments'] as const

export interface CommentToastMessages {
  postError?: string
  postErrorDescription?: string
  updateError?: string
  updateErrorDescription?: string
  deleteError?: string
  deleteErrorDescription?: string
}

export function useComments(reviewId: string) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, reviewId],
    queryFn: () => services.comments.getByReviewId(reviewId),
    enabled: !!reviewId,
  })
}

export function useCreateComment(reviewId: string, messages?: CommentToastMessages) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentDTO) => services.comments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({
        title: messages?.postError ?? 'Could not post comment',
        description: messages?.postErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useUpdateComment(reviewId: string, messages?: CommentToastMessages) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDTO }) =>
      services.comments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({
        title: messages?.updateError ?? 'Could not update comment',
        description: messages?.updateErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useDeleteComment(reviewId: string, messages?: CommentToastMessages) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
    onError: () => {
      toast.error({
        title: messages?.deleteError ?? 'Could not delete comment',
        description: messages?.deleteErrorDescription ?? 'Please try again.',
      })
    },
  })
}
