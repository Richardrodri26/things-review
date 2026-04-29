'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { useGlobalReviews } from '@/features/feed'
import { CONTENT_TYPE, CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'
import type { ReviewWithUser } from '@/entities/review/types'

type SortOption = 'recent' | 'popular' | 'rating_high' | 'rating_low'

const CONTENT_TYPE_FILTER_OPTIONS: Array<{ value: ContentType | 'all'; label: string }> = [
  { value: 'all', label: 'all' },
  ...Object.values(CONTENT_TYPE).map((ct) => ({ value: ct, label: ct })),
]

export function ExplorePage() {
  const t = useTranslations('explore')
  const tContentType = useTranslations('contentType')
  const [contentType, setContentType] = useState<ContentType | 'all'>('all')
  const [sort, setSort] = useState<SortOption>('recent')

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGlobalReviews({ contentType, sort })

  const reviews = data?.pages.flatMap((p) => p.reviews as ReviewWithUser[]) ?? []

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Content type tabs */}
        <div className="flex flex-wrap gap-1">
          {CONTENT_TYPE_FILTER_OPTIONS.map(({ value }) => (
            <button
              key={value}
              onClick={() => setContentType(value)}
              className={
                contentType === value
                  ? 'rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground'
                  : 'rounded-full px-3 py-1 text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              {value === 'all'
                ? t('filters.all')
                : `${CONTENT_TYPE_LABELS[value as ContentType].icon} ${tContentType(value as ContentType)}`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">{t('filters.sortRecent')}</SelectItem>
            <SelectItem value="popular">{t('filters.sortPopular')}</SelectItem>
            <SelectItem value="rating_high">{t('filters.sortRatingHigh')}</SelectItem>
            <SelectItem value="rating_low">{t('filters.sortRatingLow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('empty')}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                author={review.user}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  t('loadMore')
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
