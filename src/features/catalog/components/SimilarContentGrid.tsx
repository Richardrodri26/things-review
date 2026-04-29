'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { useSimilarContent } from '../hooks/useSimilarContent'
import type { ContentType } from '@/shared/types'
import { ROUTES } from '@/shared/constants'

interface SimilarContentGridProps {
  externalId: string
  contentType: Extract<ContentType, 'movie' | 'series'>
}

export function SimilarContentGrid({ externalId, contentType }: SimilarContentGridProps) {
  const t = useTranslations('catalog.similar')
  const { data: items = [], isLoading } = useSimilarContent(externalId, contentType)

  if (!isLoading && items.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {t('title')}
      </h2>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-24 space-y-1 animate-pulse"
            >
              <div className="aspect-[2/3] rounded-md bg-muted" />
              <div className="h-3 rounded bg-muted w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {items.map((item) => {
            const route = item.contentType === 'movie'
              ? ROUTES.MOVIE_DETAIL(item.externalId)
              : ROUTES.SERIES_DETAIL(item.externalId)

            return (
              <Link
                key={item.externalId}
                href={route}
                className="shrink-0 w-24 space-y-1 group"
              >
                <div className="aspect-[2/3] rounded-md overflow-hidden border border-border shadow-sm transition-transform group-hover:scale-105">
                  <CoverImage
                    src={item.coverImageUrl}
                    alt={item.title}
                    contentType={item.contentType}
                    sizes="96px"
                    className="object-cover"
                    iconSize="text-2xl"
                    title={item.title}
                  />
                </div>
                <p className="text-[11px] leading-tight line-clamp-2 text-foreground/80">
                  {item.title}
                </p>
                {item.year && (
                  <p className="text-[10px] text-muted-foreground">{item.year}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
