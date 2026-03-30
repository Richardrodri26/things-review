// src/features/catalog/components/MoviesPage.tsx
'use client'

import { FilmIcon } from 'lucide-react'
import { EmptyState } from '@/shared/ui/atoms'
import { useTranslations } from 'next-intl'
import { useStore } from '@/shared/lib/store'
import { useMovies } from '../hooks'
import { CatalogItemCard } from './CatalogItemCard'
import { AddContentDialog } from './AddContentDialog'

export function MoviesPage() {
  const { data: movies = [], isLoading } = useMovies()
  const reviews = useStore((s) => s.reviews)
  const t = useTranslations('catalog.movies')

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {t('count', { count: movies.length })}
            </span>
          )}
          <AddContentDialog defaultContentType="movie" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <EmptyState
          icon={<FilmIcon className="size-6" />}
          title={t('empty')}
          description={t('emptyDescription')}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <CatalogItemCard
              key={movie.id}
              item={movie}
              hasReview={reviewedContentIds.has(movie.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
