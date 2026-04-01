// entities/comment/types.ts
import type { User } from '@/entities/user/types'

export interface Comment {
  id: string
  reviewId: string
  groupId: string
  authorId: string
  body: string
  /**
   * ID del comentario padre. `null` = comentario raíz.
   * Actualmente solo se soporta 1 nivel de profundidad (replies a raíces).
   * Ver docs/plans/2026-03-30-comment-replies.md para escalar a hilos infinitos.
   */
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

/**
 * Comentario raíz con sus replies directas (1 nivel).
 * Para hilos infinitos, cambiar `replies` a `CommentThread[]` y hacerlo recursivo.
 */
export interface CommentThread extends CommentWithAuthor {
  replies: CommentWithAuthor[]
}

export type CreateCommentDTO = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCommentDTO = Pick<Comment, 'body'>
