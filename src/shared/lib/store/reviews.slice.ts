// shared/lib/store/reviews.slice.ts
import type { StateCreator } from 'zustand'
import type { Review } from '@/entities/review/types'
import type { RootState } from '.'

export interface ReviewsSlice {
  reviews: Review[]
  setReviews: (reviews: Review[]) => void
  addReview: (review: Review) => void
  updateReview: (id: string, data: Partial<Review>) => void
  removeReview: (id: string) => void
}

export const createReviewsSlice: StateCreator<RootState, [['zustand/immer', never]], [], ReviewsSlice> = (set) => ({
  reviews: [],

  setReviews: (reviews) => set({ reviews }),

  addReview: (review) =>
    set((state) => ({ reviews: [...state.reviews, review] })),

  updateReview: (id, data) =>
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),

  removeReview: (id) =>
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
    })),
})
