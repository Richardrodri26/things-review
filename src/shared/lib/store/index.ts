// shared/lib/store/index.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createUserSlice, type UserSlice } from './user.slice'
import { createReviewsSlice, type ReviewsSlice } from './reviews.slice'
import { createGroupsSlice, type GroupsSlice } from './groups.slice'
import { createUISlice, type UISlice } from './ui.slice'

export type RootState = UserSlice & ReviewsSlice & GroupsSlice & UISlice

export const useStore = create<RootState>()(
  devtools(
    immer((...a) => ({
      ...createUserSlice(...a),
      ...createReviewsSlice(...a),
      ...createGroupsSlice(...a),
      ...createUISlice(...a),
    })),
    { name: 'ThingsReviewStore' }
  )
)

// Selectores específicos — usar useShallow cuando se seleccionan múltiples campos
export const useUser = () => useStore((s) => s.user)
export const useReviews = () => useStore((s) => s.reviews)
export const useGroups = () => useStore((s) => s.groups)
