// src/features/dashboard/components/CatalogHighlightsSection.tsx
'use client'

import Link from 'next/link'
import { ArrowRightIcon, FilmIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CatalogItemCard } from '@/features/catalog/components'
import { useMovies } from '@/features/catalog/hooks'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import type { Review } from '@/entities/review/types'

interface CatalogHighlightsSectionProps {
  reviews: Review[]
}

const MAX_HIGHLIGHTS = 8

export function CatalogHighlightsSection({ reviews }: CatalogHighlightsSectionProps) {
  const { data: movies = [], isLoading } = useMovies()

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))
  const highlights = movies.slice(0, MAX_HIGHLIGHTS)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Movies
        </h2>
        <Link
          href={ROUTES.MOVIES}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
        >
          See all
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-28 aspect-[2/3] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <FilmIcon className="size-4 shrink-0" />
          <span>Catalog not loaded yet. Visit the Movies page to seed the catalog.</span>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {highlights.map((movie) => (
            <div key={movie.id} className="shrink-0 w-28">
              <CatalogItemCard
                item={movie}
                hasReview={reviewedContentIds.has(movie.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
