// shared/lib/store/index.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createUserSlice, type UserSlice } from './user.slice'
import { createUISlice, type UISlice } from './ui.slice'

export type RootState = UserSlice & UISlice

export const useStore = create<RootState>()(
  devtools(
    immer((...a) => ({
      ...createUserSlice(...a),
      ...createUISlice(...a),
    })),
    { name: 'ThingsReviewStore' }
  )
)

// Selectores específicos
export const useUser = () => useStore((s) => s.user)
