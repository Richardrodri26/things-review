// entities/music/types.ts
import type { ReviewableItem } from '@/shared/types'

export type MusicAlbumType = 'album' | 'ep' | 'single' | 'compilation'

export interface MusicAlbum extends ReviewableItem {
  contentType: 'music'
  artist: string
  albumType: MusicAlbumType
  totalTracks: number
  durationMs?: number
  label?: string
}
