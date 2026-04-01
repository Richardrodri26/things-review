// src/lib/rate-limiter.ts
import { RateLimiter } from '@tanstack/pacer'

export type RateLimitTier = 'search' | 'write' | 'security'

interface TierConfig {
  limit: number
  window: number
}

const TIER_CONFIG: Record<RateLimitTier, TierConfig> = {
  search:   { limit: 10, window: 10_000 },
  write:    { limit: 5,  window: 10_000 },
  security: { limit: 3,  window: 30_000 },
}

// Map key: `${userId}:${tier}` → RateLimiter instance
const limiters = new Map<string, RateLimiter<() => void>>()

function getLimiter(userId: string, tier: RateLimitTier): RateLimiter<() => void> {
  const key = `${userId}:${tier}`
  let limiter = limiters.get(key)

  if (!limiter) {
    const { limit, window } = TIER_CONFIG[tier]
    limiter = new RateLimiter(
      () => {}, // no-op — we only use maybeExecute() for the boolean
      { limit, window }
    )
    limiters.set(key, limiter)
  }

  return limiter
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number // seconds — present only when not allowed
}

/**
 * Check whether userId is within the rate limit for the given tier.
 * Returns { allowed: true } if the call should proceed,
 * or { allowed: false, retryAfter: N } if it should be rejected with 429.
 */
export function checkRateLimit(userId: string, tier: RateLimitTier): RateLimitResult {
  const limiter = getLimiter(userId, tier)
  const allowed = limiter.maybeExecute()

  if (!allowed) {
    const retryAfterMs = limiter.getMsUntilNextWindow()
    const retryAfter = Math.ceil(retryAfterMs / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}
