// src/features/catalog/components/SeriesPage.tsx
'use client'

import { useMemo } from 'react'
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
import { TvIcon } from 'lucide-react'
import { EmptyState } from '@/shared/ui/atoms'
import { useTranslations } from 'next-intl'
import { useReviews } from '@/features/reviews/hooks'
import { useSeriesList } from '../hooks'
import { CatalogItemCard } from './CatalogItemCard'
import { AddContentDialog } from './AddContentDialog'
import { CatalogFilters, type ReviewedFilter } from './CatalogFilters'
import type { Genre } from '@/shared/types'

export function SeriesPage() {
  const { data: seriesList = [], isLoading } = useSeriesList()
  const { data: reviews = [] } = useReviews()
  const t = useTranslations('catalog.series')

  const reviewedContentIds = useMemo(
    () => new Set(reviews.map((r) => r.contentId)),
    [reviews]
  )

  // Filter state — URL-persisted via nuqs
  const [selectedGenresRaw, setSelectedGenres] = useQueryState(
    'genres',
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [reviewedFilterRaw, setReviewedFilter] = useQueryState<ReviewedFilter>(
    'reviewed',
    {
      defaultValue: null,
      parse: (v): ReviewedFilter =>
        v === 'reviewed' || v === 'not_reviewed' ? v : null,
      serialize: (v) => v ?? '',
    }
  )

  const selectedGenres = selectedGenresRaw as string[]
  const reviewedFilter = reviewedFilterRaw as ReviewedFilter

  // Collect unique genres from all series
  const availableGenres = useMemo<Genre[]>(() => {
    const map = new Map<string, Genre>()
    seriesList.forEach((s) =>
      s.genres?.forEach((g) => {
        if (!map.has(g.id)) map.set(g.id, g)
      })
    )
    return Array.from(map.values())
  }, [seriesList])

  // Filtered list
  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      const matchesGenre =
        selectedGenres.length === 0 ||
        series.genres?.some((g) => selectedGenres.includes(g.id))
      const hasReview = reviewedContentIds.has(series.id)
      const matchesReviewed =
        reviewedFilter === null ||
        (reviewedFilter === 'reviewed' && hasReview) ||
        (reviewedFilter === 'not_reviewed' && !hasReview)
      return matchesGenre && matchesReviewed
    })
  }, [seriesList, selectedGenres, reviewedFilter, reviewedContentIds])

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    )
  }

  function clearFilters() {
    setSelectedGenres(null)
    setReviewedFilter(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {t('count', { count: seriesList.length })}
            </span>
          )}
          <AddContentDialog defaultContentType="series" />
        </div>
      </div>

      {/* Filters */}
      {!isLoading && seriesList.length > 0 && (
        <CatalogFilters
          genres={availableGenres}
          selectedGenres={selectedGenres}
          reviewedFilter={reviewedFilter}
          onGenreToggle={toggleGenre}
          onReviewedFilterChange={setReviewedFilter}
          onClearAll={clearFilters}
          totalResults={filteredSeries.length}
          totalItems={seriesList.length}
        />
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <EmptyState
          icon={<TvIcon className="size-6" />}
          title={t('empty')}
          description={t('emptyDescription')}
        />
      ) : filteredSeries.length === 0 ? (
        <EmptyState
          icon={<TvIcon className="size-6" />}
          title={t('noMatch')}
          description={t('noMatchDescription')}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {filteredSeries.map((series) => (
            <CatalogItemCard
              key={series.id}
              item={series}
              hasReview={reviewedContentIds.has(series.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
