// shared/lib/store/ui.slice.ts
import type { StateCreator } from 'zustand'
import type { RootState } from '.'

export interface UISlice {
  openOverlays: string[]
  openOverlay: (id: string) => void
  closeOverlay: (id: string) => void
  isOverlayOpen: (id: string) => boolean
}

export const createUISlice: StateCreator<RootState, [['zustand/immer', never]], [], UISlice> = (set, get) => ({
  openOverlays: [],

  openOverlay: (id) =>
    set((state) => ({
      openOverlays: state.openOverlays.includes(id)
        ? state.openOverlays
        : [...state.openOverlays, id],
    })),

  closeOverlay: (id) =>
    set((state) => ({
      openOverlays: state.openOverlays.filter((o) => o !== id),
    })),

  isOverlayOpen: (id) => get().openOverlays.includes(id),
})
