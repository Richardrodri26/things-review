// shared/lib/store/groups.slice.ts
import type { StateCreator } from 'zustand'
import type { Group } from '@/entities/group/types'
import type { RootState } from '.'

export interface GroupsSlice {
  groups: Group[]
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, data: Partial<Group>) => void
  removeGroup: (id: string) => void
}

export const createGroupsSlice: StateCreator<RootState, [['zustand/immer', never]], [], GroupsSlice> = (set) => ({
  groups: [],

  setGroups: (groups) => set({ groups }),

  addGroup: (group) =>
    set((state) => ({ groups: [...state.groups, group] })),

  updateGroup: (id, data) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...data } : g)),
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    })),
})
