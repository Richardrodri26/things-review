// shared/services/review.service.ts
import type { Review, CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface IReviewService {
  getAll(): Promise<Review[]>
  getById(id: string): Promise<Review | null>
  create(data: CreateReviewDTO): Promise<Review>
  update(id: string, data: UpdateReviewDTO): Promise<Review>
  delete(id: string): Promise<void>
  getByContentId(contentId: string): Promise<Review[]>
  getByUserId(userId: string): Promise<Review[]>
  getGroupReviews(groupId: string, contentId: string, memberIds: string[]): Promise<Review[]>
}

export class LocalReviewService implements IReviewService {
  private readAll(): Review[] {
    return getFromStorage<Review[]>(STORAGE_KEYS.REVIEWS, [])
  }

  private writeAll(reviews: Review[]): void {
    setToStorage(STORAGE_KEYS.REVIEWS, reviews)
  }

  async getAll(): Promise<Review[]> {
    return this.readAll()
  }

  async getById(id: string): Promise<Review | null> {
    return this.readAll().find(r => r.id === id) ?? null
  }

  async create(data: CreateReviewDTO): Promise<Review> {
    const review: Review = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeAll([...this.readAll(), review])
    return review
  }

  async update(id: string, data: UpdateReviewDTO): Promise<Review> {
    const all = this.readAll()
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Review not found: ${id}`)
    const updated: Review = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter(r => r.id !== id))
  }

  async getByContentId(contentId: string): Promise<Review[]> {
    return this.readAll().filter(r => r.contentId === contentId)
  }

  async getByUserId(userId: string): Promise<Review[]> {
    return this.readAll().filter(r => r.userId === userId)
  }

  async getGroupReviews(
    _groupId: string,
    contentId: string,
    memberIds: string[]
  ): Promise<Review[]> {
    return this.readAll().filter(
      r => r.contentId === contentId && memberIds.includes(r.userId)
    )
  }
}
