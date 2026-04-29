'use client'

import Link from 'next/link'
import { CompassIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { useFeed } from '../hooks'
import { ROUTES } from '@/shared/constants'
import type { ReviewWithUser } from '@/entities/review/types'

const MAX_PREVIEW = 5

export function FeedSection() {
  const t = useTranslations('feed')
  const { data, isLoading } = useFeed()

  const reviews = data?.pages.flatMap((p) => p.reviews as ReviewWithUser[]) ?? []

  if (isLoading) return null
  if (reviews.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('title')}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
          <CompassIcon className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
          <Link
            href={ROUTES.EXPLORE}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('emptyAction')} →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('title')}
        </h2>
        <Link
          href={ROUTES.EXPLORE}
          className="text-xs text-primary hover:underline"
        >
          {t('seeMore')} →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {reviews.slice(0, MAX_PREVIEW).map((review) => (
          <div key={review.id} className="w-40 shrink-0 snap-start">
            <ReviewCard
              review={review}
              author={review.user}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
