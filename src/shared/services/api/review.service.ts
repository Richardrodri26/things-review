import type { Review, CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import type { IReviewService } from '../review.service'
import { apiGet, apiPost, apiPatch, apiDelete } from './api-client'

export class ApiReviewService implements IReviewService {
  async getAll(): Promise<Review[]> {
    return apiGet<Review[]>('/reviews')
  }

  async getById(id: string): Promise<Review | null> {
    try {
      return await apiGet<Review>(`/reviews/${id}`)
    } catch {
      return null
    }
  }

  async create(data: CreateReviewDTO): Promise<Review> {
    return apiPost<Review>('/reviews', data)
  }

  async update(id: string, data: UpdateReviewDTO): Promise<Review> {
    return apiPatch<Review>(`/reviews/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiDelete(`/reviews/${id}`)
  }

  async getByContentId(contentId: string): Promise<Review[]> {
    return apiGet<Review[]>('/reviews/by-content', { contentId })
  }

  async getByUserId(_userId: string): Promise<Review[]> {
    // El backend filtra automáticamente por el usuario autenticado
    return apiGet<Review[]>('/reviews')
  }

  async getGroupReviews(groupId: string, contentId: string, memberIds: string[]): Promise<Review[]> {
    return apiGet<Review[]>('/reviews/by-content', {
      contentId,
      groupId,
      memberIds: memberIds.join(','),
    })
  }
}
