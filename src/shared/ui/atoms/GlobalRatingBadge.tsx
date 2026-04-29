'use client'

import { StarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface GlobalRatingBadgeProps {
  averageRating: number | null
  totalReviews: number
  size?: 'sm' | 'md'
  className?: string
}

export function GlobalRatingBadge({
  averageRating,
  totalReviews,
  size = 'sm',
  className,
}: GlobalRatingBadgeProps) {
  const t = useTranslations('catalog.globalRating')

  if (totalReviews === 0 || averageRating === null) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {t('noRatings')}
      </span>
    )
  }

  return (
    <div className={cn('flex flex-col', size === 'md' ? 'gap-0.5' : '', className)}>
      <div className={cn('flex items-center gap-1', size === 'md' ? 'text-sm' : 'text-xs')}>
        <StarIcon className={cn('fill-yellow-400 text-yellow-400', size === 'md' ? 'size-4' : 'size-3')} />
        <span className="font-semibold">{averageRating.toFixed(1)}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {t('fromReviews', { count: totalReviews })}
      </span>
    </div>
  )
}
