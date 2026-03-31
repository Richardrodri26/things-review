// src/features/catalog/components/CatalogItemCard.tsx
import Link from 'next/link'
import { StarIcon } from 'lucide-react'
import { ROUTES } from '@/shared/constants'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'

type CatalogItemCardProps =
  | { item: Movie; hasReview: boolean }
  | { item: Series; hasReview: boolean }

export function CatalogItemCard({ item, hasReview }: CatalogItemCardProps) {
  const href =
    item.contentType === 'movie'
      ? ROUTES.MOVIE_DETAIL(item.id)
      : ROUTES.SERIES_DETAIL(item.id)

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors w-full"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <CoverImage
          src={item.coverImageUrl}
          alt={item.title}
          contentType={item.contentType}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          className="object-cover transition-transform group-hover:scale-105"
          iconSize="text-5xl"
          title={item.title}
        />
        {hasReview && (
          <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-1 shadow">
            <StarIcon className="size-3 text-primary-foreground fill-primary-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-medium leading-snug line-clamp-2">{item.title}</p>
        <p className="text-[10px] text-muted-foreground">{item.year}</p>
      </div>
    </Link>
  )
}
