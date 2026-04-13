// src/features/dashboard/components/RecentReviewsSection.tsx
'use client'

import Link from 'next/link'
import { ArrowRightIcon, BookOpenIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import { extractPlainText } from '@/components/editor/editor-client'
import { formatDate } from '@/shared/utils'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import type { Review } from '@/entities/review/types'

const MAX_RECENT = 3

function RecentReviewCard({ review }: { review: Review }) {
  const itemTitle = useCatalogItemTitle(review.contentId, review.contentType)
  const bodyPreview = review.body ? extractPlainText(review.body) : undefined

  return (
    <Link
      href={`${ROUTES.REVIEW_DETAIL(review.id)}?from=${encodeURIComponent(ROUTES.HOME)}`}
      className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md flex flex-col"
    >
      {/* Subtle left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Top row: item title + date */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {itemTitle ?? review.contentId}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
          </div>
          <ArrowRightIcon className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-0.5" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ContentTypeBadge contentType={review.contentType} />
          <StatusBadge status={review.status} contentType={review.contentType} />
        </div>

        {/* Review title */}
        {review.title && (
          <p className="text-xs font-medium text-foreground/80 leading-snug">
            &ldquo;{review.title}&rdquo;
          </p>
        )}

        {/* Body preview */}
        {bodyPreview && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {bodyPreview}
          </p>
        )}
      </div>

      {/* Footer with rating */}
      {review.rating && (
        <div className="border-t border-border/60 px-4 py-2.5">
          <RatingStars value={review.rating} readonly size="sm" showValue />
        </div>
      )}
    </Link>
  )
}

interface RecentReviewsSectionProps {
  reviews: Review[]
}

export function RecentReviewsSection({ reviews }: RecentReviewsSectionProps) {
  const t = useTranslations('dashboard.recentReviews')
  const tCommon = useTranslations('common')
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const recent = sorted.slice(0, MAX_RECENT)

  return (
    <section className="space-y-4 min-w-0">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          {t('title')}
        </span>
        <div className="flex-1 h-px bg-border" />
        {reviews.length > 0 && (
          <Link
            href={ROUTES.REVIEWS}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1 h-6 px-2 text-xs text-muted-foreground hover:text-foreground'
            )}
          >
            {tCommon('seeAll')}
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </div>

      {reviews.length === 0 ? (
        /* Empty state — editorial style */
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 flex flex-col items-center gap-4 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <BookOpenIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {t('empty')}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t('emptyDescription')}
            </p>
          </div>
          <Link href={ROUTES.MOVIES} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            {t('browseMovies')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((review) => (
            <RecentReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}
