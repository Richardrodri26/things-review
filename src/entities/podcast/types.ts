// entities/podcast/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Podcast extends ReviewableItem {
  contentType: 'podcast'
  host: string[]
  totalEpisodes?: number
  language: string
  isActive: boolean
}
