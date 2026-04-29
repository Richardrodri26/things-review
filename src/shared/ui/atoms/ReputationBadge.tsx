'use client'

import { useTranslations } from 'next-intl'
import { getTierInfo } from '@/entities/reputation/utils'
import type { ReputationTier } from '@/entities/reputation/types'
import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  score: number
  tier: ReputationTier
  variant?: 'inline' | 'card'
  className?: string
}

export function ReputationBadge({ score, tier, variant = 'inline', className }: ReputationBadgeProps) {
  const t = useTranslations('reputation.tier')
  const { icon, colorClass } = getTierInfo(score)

  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5 text-xs', colorClass, className)}
        title={t(tier)}
      >
        <span>{icon}</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border px-3 py-2',
        className
      )}
    >
      <span className="text-2xl">{icon}</span>
      <div className="space-y-0.5">
        <p className={cn('text-sm font-semibold leading-none', colorClass)}>{t(tier)}</p>
        <p className="text-xs text-muted-foreground">
          {score} pts
        </p>
      </div>
    </div>
  )
}
