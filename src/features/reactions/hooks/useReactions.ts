import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reactionService } from '@/shared/services/api/reaction.service'
import type { ReactionSummary, ReactionType } from '@/entities/reaction/types'

// ─── Query keys ──────────────────────────────────────────────────────────────

export const reviewReactionKey = (reviewId: string) => ['reactions', 'review', reviewId] as const
export const commentReactionKey = (commentId: string) => ['reactions', 'comment', commentId] as const

// ─── Review reactions ────────────────────────────────────────────────────────

export function useReviewReactions(reviewId: string) {
  return useQuery({
    queryKey: reviewReactionKey(reviewId),
    queryFn: () => reactionService.getReviewReactions(reviewId),
    enabled: !!reviewId,
  })
}

export function useToggleReviewReaction(reviewId: string) {
  const queryClient = useQueryClient()
  const key = reviewReactionKey(reviewId)

  return useMutation({
    mutationFn: (type: ReactionType) => reactionService.toggleReviewReaction(reviewId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ReactionSummary>(key)

      queryClient.setQueryData<ReactionSummary>(key, (old) => {
        if (!old) return old
        const isSameType = old.userReaction === type
        const wasLike = old.userReaction === 'like'
        const wasDislike = old.userReaction === 'dislike'

        return {
          likeCount: isSameType && type === 'like'
            ? old.likeCount - 1
            : type === 'like'
              ? old.likeCount + 1
              : wasLike
                ? old.likeCount - 1
                : old.likeCount,
          dislikeCount: isSameType && type === 'dislike'
            ? old.dislikeCount - 1
            : type === 'dislike'
              ? old.dislikeCount + 1
              : wasDislike
                ? old.dislikeCount - 1
                : old.dislikeCount,
          userReaction: isSameType ? null : type,
        }
      })

      return { previous }
    },
    onError: (_err, _type, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

// ─── Comment reactions ───────────────────────────────────────────────────────

export function useCommentReactions(commentId: string) {
  return useQuery({
    queryKey: commentReactionKey(commentId),
    queryFn: () => reactionService.getCommentReactions(commentId),
    enabled: !!commentId,
  })
}

export function useToggleCommentReaction(commentId: string) {
  const queryClient = useQueryClient()
  const key = commentReactionKey(commentId)

  return useMutation({
    mutationFn: (type: ReactionType) => reactionService.toggleCommentReaction(commentId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ReactionSummary>(key)

      queryClient.setQueryData<ReactionSummary>(key, (old) => {
        if (!old) return old
        const isSameType = old.userReaction === type
        const wasLike = old.userReaction === 'like'
        const wasDislike = old.userReaction === 'dislike'

        return {
          likeCount: isSameType && type === 'like'
            ? old.likeCount - 1
            : type === 'like'
              ? old.likeCount + 1
              : wasLike
                ? old.likeCount - 1
                : old.likeCount,
          dislikeCount: isSameType && type === 'dislike'
            ? old.dislikeCount - 1
            : type === 'dislike'
              ? old.dislikeCount + 1
              : wasDislike
                ? old.dislikeCount - 1
                : old.dislikeCount,
          userReaction: isSameType ? null : type,
        }
      })

      return { previous }
    },
    onError: (_err, _type, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
