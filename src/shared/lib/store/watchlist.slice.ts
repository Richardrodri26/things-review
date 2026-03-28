// shared/lib/store/watchlist.slice.ts
import type { StateCreator } from 'zustand'
import type { WatchlistItem } from '@/entities/watchlist/types'
import type { RootState } from '.'

export interface WatchlistSlice {
  watchlist: WatchlistItem[]
  setWatchlist: (items: WatchlistItem[]) => void
  addWatchlistItem: (item: WatchlistItem) => void
  updateWatchlistItem: (id: string, data: Partial<WatchlistItem>) => void
  removeWatchlistItem: (id: string) => void
}

export const createWatchlistSlice: StateCreator<
  RootState,
  [['zustand/immer', never]],
  [],
  WatchlistSlice
> = (set) => ({
  watchlist: [],

  setWatchlist: (items) => set({ watchlist: items }),

  addWatchlistItem: (item) =>
    set((state) => ({ watchlist: [...state.watchlist, item] })),

  updateWatchlistItem: (id, data) =>
    set((state) => ({
      watchlist: state.watchlist.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),

  removeWatchlistItem: (id) =>
    set((state) => ({
      watchlist: state.watchlist.filter((i) => i.id !== id),
    })),
})
