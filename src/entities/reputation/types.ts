export type ReputationTier = 'newbie' | 'contributor' | 'enthusiast' | 'expert' | 'legend'

export interface ReputationBreakdown {
  reviewLikes: number
  reviewDislikes: number
  commentLikes: number
  commentDislikes: number
  totalReviews: number
}

export interface ReputationData {
  score: number
  tier: ReputationTier
  breakdown: ReputationBreakdown
}
