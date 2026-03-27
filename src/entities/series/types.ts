// entities/series/types.ts
import type { ReviewableItem } from '@/shared/types'

export const SERIES_STATUS = {
  RETURNING: 'returning_series',
  ENDED: 'ended',
  CANCELED: 'canceled',
  IN_PRODUCTION: 'in_production',
  PLANNED: 'planned',
} as const

export type SeriesStatus = (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS]

export interface Network {
  id: string
  name: string
  logoUrl?: string
}

export interface Series extends ReviewableItem {
  contentType: 'series'
  originalTitle?: string
  firstAirDate: string
  lastAirDate?: string
  numberOfSeasons: number
  numberOfEpisodes: number
  status: SeriesStatus
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  networks?: Network[]
}
