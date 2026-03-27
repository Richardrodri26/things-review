// entities/comment/types.ts
import type { User } from '@/entities/user/types'

export interface Comment {
  id: string
  reviewId: string
  groupId: string
  authorId: string
  body: string
  createdAt: Date
  updatedAt: Date
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export type CreateCommentDTO = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCommentDTO = Pick<Comment, 'body'>
