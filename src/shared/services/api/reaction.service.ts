import { apiGet, apiPost } from './api-client'
import type { ReactionSummary, ReactionType } from '@/entities/reaction/types'

export class ApiReactionService {
  async getReviewReactions(reviewId: string): Promise<ReactionSummary> {
    return apiGet<ReactionSummary>(`/reviews/${reviewId}/reactions`)
  }

  async toggleReviewReaction(reviewId: string, type: ReactionType): Promise<ReactionSummary> {
    return apiPost<ReactionSummary>(`/reviews/${reviewId}/reactions`, { type })
  }

  async getCommentReactions(commentId: string): Promise<ReactionSummary> {
    return apiGet<ReactionSummary>(`/comments/${commentId}/reactions`)
  }

  async toggleCommentReaction(commentId: string, type: ReactionType): Promise<ReactionSummary> {
    return apiPost<ReactionSummary>(`/comments/${commentId}/reactions`, { type })
  }
}

export const reactionService = new ApiReactionService()
