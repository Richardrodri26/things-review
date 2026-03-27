// entities/game/types.ts
import type { ReviewableItem } from '@/shared/types'

export const GAME_PLATFORM = {
  PC: 'pc',
  PS5: 'playstation_5',
  PS4: 'playstation_4',
  XBOX_SERIES: 'xbox_series',
  XBOX_ONE: 'xbox_one',
  SWITCH: 'nintendo_switch',
  MOBILE: 'mobile',
  OTHER: 'other',
} as const

export type GamePlatform = (typeof GAME_PLATFORM)[keyof typeof GAME_PLATFORM]

export interface Game extends ReviewableItem {
  contentType: 'game'
  developer?: string
  publisher?: string
  platforms: GamePlatform[]
  metacriticScore?: number
}
