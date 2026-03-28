// src/features/dashboard/components/QuickStatsSection.tsx
import { BookOpenIcon, StarIcon } from 'lucide-react'
import { StatsCard, RatingStars } from '@/shared/ui/atoms'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { computeUserStats } from '@/features/profile/lib/computeUserStats'
import type { Review } from '@/entities/review/types'

interface QuickStatsSectionProps {
  reviews: Review[]
}

export function QuickStatsSection({ reviews }: QuickStatsSectionProps) {
  const stats = computeUserStats(reviews)

  const activeTypes = (
    Object.entries(stats.reviewsByContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][]
  )
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Overview
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard
          label="Total Reviews"
          value={stats.totalReviews}
          icon={<BookOpenIcon className="size-4" />}
        />
        <StatsCard
          label="Avg Rating"
          value={stats.averageRating !== null ? stats.averageRating : '—'}
          icon={<StarIcon className="size-4" />}
        />
      </div>

      {activeTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeTypes.map(([contentType, count]) => {
            const label = CONTENT_TYPE_LABELS[contentType]
            return (
              <div
                key={contentType}
                className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-lg" aria-hidden>{label.icon}</span>
                <div>
                  <p className="text-sm font-medium">{count}</p>
                  <p className="text-xs text-muted-foreground">{label.en}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stats.averageRating !== null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RatingStars value={Math.round(stats.averageRating) as 1 | 2 | 3 | 4 | 5} readonly size="sm" />
          <span>average across {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}</span>
        </div>
      )}
    </section>
  )
}
