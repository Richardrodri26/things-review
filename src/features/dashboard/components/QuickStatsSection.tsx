// src/features/dashboard/components/QuickStatsSection.tsx
'use client'

import { BookOpenIcon, StarIcon, TrendingUpIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RatingStars } from '@/shared/ui/atoms'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { computeUserStats } from '@/features/profile/lib/computeUserStats'
import type { Review } from '@/entities/review/types'

interface QuickStatsSectionProps {
  reviews: Review[]
}

export function QuickStatsSection({ reviews }: QuickStatsSectionProps) {
  const stats = computeUserStats(reviews)
  const t = useTranslations('dashboard.stats')
  const tContentType = useTranslations('contentType')

  const activeTypes = (
    Object.entries(stats.reviewsByContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][]
  )
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <section className="space-y-4 min-w-0">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          {t('title')}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Primary stats — large editorial numbers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total reviews */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-5 group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 0% 100%, oklch(0.488 0.243 264.376 / 0.06) 0%, transparent 70%)' }} />
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <BookOpenIcon className="size-3.5" />
            <span className="text-[10px] font-semibold tracking-widest uppercase">{t('reviews')}</span>
          </div>
          <p
            className="text-5xl font-black leading-none tracking-tighter text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {stats.totalReviews}
          </p>
        </div>

        {/* Avg rating */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-5 group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 100% 100%, oklch(0.809 0.105 251.813 / 0.06) 0%, transparent 70%)' }} />
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <StarIcon className="size-3.5" />
            <span className="text-[10px] font-semibold tracking-widest uppercase">{t('avgRating')}</span>
          </div>
          {stats.averageRating !== null ? (
            <>
              <p
                className="text-5xl font-black leading-none tracking-tighter text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stats.averageRating}
              </p>
              <div className="mt-2">
                <RatingStars value={stats.averageRating} readonly size="sm" />
              </div>
            </>
          ) : (
            <p
              className="text-5xl font-black leading-none tracking-tighter text-muted-foreground/30"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              —
            </p>
          )}
        </div>
      </div>

      {/* Content type breakdown */}
      {activeTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUpIcon className="size-3.5 text-muted-foreground shrink-0" />
          {activeTypes.map(([contentType, count]) => {
            const label = CONTENT_TYPE_LABELS[contentType]
            return (
              <div
                key={contentType}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
              >
                <span aria-hidden>{label.icon}</span>
                <span className="font-semibold">{count}</span>
                <span className="text-muted-foreground">{tContentType(contentType)}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
