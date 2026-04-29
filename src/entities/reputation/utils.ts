import type { ReputationTier } from './types'

export const TIER_THRESHOLDS: {
  min: number
  tier: ReputationTier
  icon: string
  colorClass: string
}[] = [
  { min: 500, tier: 'legend', icon: '👑', colorClass: 'text-yellow-500' },
  { min: 150, tier: 'expert', icon: '💎', colorClass: 'text-purple-500' },
  { min: 50, tier: 'enthusiast', icon: '🔥', colorClass: 'text-orange-500' },
  { min: 10, tier: 'contributor', icon: '⭐', colorClass: 'text-blue-500' },
  { min: 0, tier: 'newbie', icon: '🌱', colorClass: 'text-muted-foreground' },
]

export function getTierInfo(score: number) {
  return TIER_THRESHOLDS.find((t) => score >= t.min) ?? TIER_THRESHOLDS.at(-1)!
}
