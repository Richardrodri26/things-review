import type { Comment, CommentThread, CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'
import type { ICommentService } from '../comment.service'
import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'

export class ApiCommentService implements ICommentService {
  async getByReviewId(reviewId: string): Promise<CommentThread[]> {
    return apiGet<CommentThread[]>('/comments/by-review', { reviewId })
  }

  async create(data: CreateCommentDTO): Promise<Comment> {
    return apiPost<Comment>('/comments', data)
  }

  async update(id: string, data: UpdateCommentDTO): Promise<Comment> {
    return apiPatch<Comment>(`/comments/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiDelete(`/comments/${id}`)
  }
}
