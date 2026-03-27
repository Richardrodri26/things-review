// entities/group/types.ts
import type {
  ContentType,
  GroupVisibility,
  GroupRole,
  Rating,
} from '@/shared/types'
import type { User } from '@/entities/user/types'
import type { ReviewWithUser } from '@/entities/review/types'
import type { ReviewableItem } from '@/shared/types'
import type { Review } from '@/entities/review/types'
import type { CommentWithAuthor } from '@/entities/comment/types'

export interface Group {
  id: string
  name: string
  description?: string
  avatarUrl?: string
  visibility: GroupVisibility
  inviteCode: string
  ownerId: string
  memberIds: string[]
  focusContentTypes?: ContentType[]
  createdAt: Date
  updatedAt: Date
}

export interface GroupMembership {
  userId: string
  groupId: string
  role: GroupRole
  joinedAt: Date
}

export interface GroupRatingSummary {
  contentId: string
  contentType: ContentType
  groupId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<Rating, number>
  reviews: ReviewWithUser[]
}

export interface ReviewInGroup extends ReviewWithUser {
  comments: CommentWithAuthor[]
  commentCount: number
}

export interface ReviewableItemWithUserReview {
  item: ReviewableItem
  userReview?: Review
}

export type CreateGroupDTO = Omit<Group, 'id' | 'inviteCode' | 'memberIds' | 'createdAt' | 'updatedAt'>
export type UpdateGroupDTO = Partial<Pick<Group, 'name' | 'description' | 'avatarUrl' | 'visibility' | 'focusContentTypes'>>
