// src/features/dashboard/components/CatalogHighlightsSection.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, StarIcon, BookOpenIcon, HeadphonesIcon, GamepadIcon, MusicIcon, Tv2Icon, FilmIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useMovies, useSeriesList } from '@/features/catalog/hooks'
import { useStore } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import type { Review } from '@/entities/review/types'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'

interface CatalogHighlightsSectionProps {
  reviews: Review[]
}

const MAX_HIGHLIGHTS = 10

// ── Poster card ──────────────────────────────────────────────────────────────

function PosterCard({
  item,
  hasReview,
}: {
  item: Movie | Series
  hasReview: boolean
}) {
  const href =
    item.contentType === 'movie'
      ? ROUTES.MOVIE_DETAIL(item.id)
      : ROUTES.SERIES_DETAIL(item.id)

  return (
    <Link href={href} className="group relative flex-shrink-0 w-[100px] sm:w-[120px]">
      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-lg transition-shadow duration-300">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100px, 120px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-[10px] text-center px-2 leading-tight">
            {item.title}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 rounded-lg" />
        {hasReview && (
          <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-1 shadow-md">
            <StarIcon className="size-2.5 text-primary-foreground fill-primary-foreground" />
          </div>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{item.year}</p>
      </div>
    </Link>
  )
}

// ── Poster shelf ─────────────────────────────────────────────────────────────

function PosterShelf({
  label,
  href,
  items,
  reviewedIds,
  isLoading,
  emptyText,
}: {
  label: string
  href: string
  items: (Movie | Series)[]
  reviewedIds: Set<string>
  isLoading: boolean
  emptyText: string
}) {
  const highlights = items.slice(0, MAX_HIGHLIGHTS)

  return (
    <div className="space-y-3">
      {/* shelf header */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1 h-6 px-2 text-xs text-muted-foreground hover:text-foreground'
          )}
        >
          See all
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[100px] sm:w-[120px] aspect-[2/3] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {highlights.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              hasReview={reviewedIds.has(item.id)}
            />
          ))}
          <Link
            href={href}
            className="flex-shrink-0 w-[100px] sm:w-[120px] aspect-[2/3] rounded-lg border border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground self-start"
          >
            <ArrowRightIcon className="size-4" />
            <span className="text-[10px] font-medium text-center leading-tight px-2">
              All {label.toLowerCase()}
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Category quick-access tiles ───────────────────────────────────────────────

const OTHER_CATEGORIES = [
  {
    key: 'music' as const,
    label: 'Music',
    icon: MusicIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-500/8 dark:bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    key: 'game' as const,
    label: 'Games',
    icon: GamepadIcon,
    color: 'text-green-500',
    bg: 'bg-green-500/8 dark:bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    key: 'book' as const,
    label: 'Books',
    icon: BookOpenIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-500/8 dark:bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    key: 'podcast' as const,
    label: 'Podcasts',
    icon: HeadphonesIcon,
    color: 'text-purple-500',
    bg: 'bg-purple-500/8 dark:bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

function CategoryTiles({ reviews }: { reviews: Review[] }) {
  const countByType = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.contentType] = (acc[r.contentType] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
          More Categories
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {OTHER_CATEGORIES.map(({ key, label, icon: Icon, color, bg, border }) => {
          const count = countByType[key] ?? 0
          return (
            <Link
              key={key}
              href={ROUTES.REVIEWS}
              className={cn(
                'group relative rounded-xl border p-4 flex flex-col gap-2 hover:shadow-sm transition-all duration-200',
                bg,
                border
              )}
            >
              <div className={cn('size-8 rounded-lg flex items-center justify-center bg-background/60', color)}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {count > 0 ? `${count} ${count === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}
                </p>
              </div>
              <ArrowRightIcon className="size-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 absolute top-4 right-4" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CatalogHighlightsSection({ reviews }: CatalogHighlightsSectionProps) {
  const { data: movies = [], isLoading: moviesLoading } = useMovies()
  const { data: seriesList = [], isLoading: seriesLoading } = useSeriesList()

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))

  return (
    <section className="space-y-8">
      <PosterShelf
        label="Movies"
        href={ROUTES.MOVIES}
        items={movies}
        reviewedIds={reviewedContentIds}
        isLoading={moviesLoading}
        emptyText="No movies in catalog yet."
      />
      <PosterShelf
        label="Series"
        href={ROUTES.SERIES}
        items={seriesList}
        reviewedIds={reviewedContentIds}
        isLoading={seriesLoading}
        emptyText="No series in catalog yet."
      />
      <CategoryTiles reviews={reviews} />
    </section>
  )
}
