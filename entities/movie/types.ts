// entities/movie/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Movie extends ReviewableItem {
  contentType: 'movie'
  originalTitle?: string
  runtime?: number
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  releaseDate: string
}
