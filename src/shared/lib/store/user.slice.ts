// shared/lib/store/user.slice.ts
import type { StateCreator } from 'zustand'
import type { User } from '@/entities/user/types'
import type { RootState } from '.'

export interface UserSlice {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (data: Partial<User>) => void
}

export const createUserSlice: StateCreator<RootState, [['zustand/immer', never]], [], UserSlice> = (set) => ({
  user: null,

  setUser: (user) => set({ user }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
})
