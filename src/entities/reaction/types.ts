export type ReactionType = 'like' | 'dislike'

export interface Reaction {
  id: string
  userId: string
  type: ReactionType
  createdAt: Date
}

export interface ReactionSummary {
  likeCount: number
  dislikeCount: number
  userReaction: ReactionType | null
}

export interface ToggleReactionDTO {
  type: ReactionType
}
