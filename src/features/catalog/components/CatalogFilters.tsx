// src/features/catalog/components/CatalogFilters.tsx
'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Genre } from '@/shared/types'

export type ReviewedFilter = 'reviewed' | 'not_reviewed' | null

interface CatalogFiltersProps {
  genres: Genre[]
  selectedGenres: string[]
  reviewedFilter: ReviewedFilter
  onGenreToggle: (genreId: string) => void
  onReviewedFilterChange: (value: ReviewedFilter) => void
  onClearAll: () => void
  totalResults: number
  totalItems: number
}

export function CatalogFilters({
  genres,
  selectedGenres,
  reviewedFilter,
  onGenreToggle,
  onReviewedFilterChange,
  onClearAll,
  totalResults,
  totalItems,
}: CatalogFiltersProps) {
  const t = useTranslations('catalog.filters')
  const tCommon = useTranslations('common')

  const hasFilters = selectedGenres.length > 0 || reviewedFilter !== null
  const isFiltered = hasFilters && totalResults < totalItems

  return (
    <div className="space-y-2.5">
      {/* Genre filters */}
      {genres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">{t('genre')}</span>
          {genres.map((genre) => {
            const isActive = selectedGenres.includes(genre.id)
            return (
              <Button
                key={genre.id}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() => onGenreToggle(genre.id)}
                className={cn('gap-1', isActive && 'shadow-none')}
              >
                {genre.name}
              </Button>
            )
          })}
        </div>
      )}

      {/* Reviewed filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={reviewedFilter === 'reviewed' ? 'default' : 'outline'}
          size="xs"
          onClick={() =>
            onReviewedFilterChange(reviewedFilter === 'reviewed' ? null : 'reviewed')
          }
          className={cn(reviewedFilter === 'reviewed' && 'shadow-none')}
        >
          {t('reviewed')}
        </Button>
        <Button
          variant={reviewedFilter === 'not_reviewed' ? 'default' : 'outline'}
          size="xs"
          onClick={() =>
            onReviewedFilterChange(reviewedFilter === 'not_reviewed' ? null : 'not_reviewed')
          }
          className={cn(reviewedFilter === 'not_reviewed' && 'shadow-none')}
        >
          {t('notReviewed')}
        </Button>
      </div>

      {/* Clear + result count */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isFiltered
              ? t('count', { filtered: totalResults, total: totalItems })
              : t('countAll', { count: totalItems })}
          </span>
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            {tCommon('clearFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}
