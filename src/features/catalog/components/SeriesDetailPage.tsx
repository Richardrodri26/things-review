// src/features/catalog/components/SeriesDetailPage.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, PencilIcon } from 'lucide-react'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { BackdropImage } from '@/shared/ui/atoms/BackdropImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { ReviewEditorPage } from '@/features/reviews/components/ReviewEditorPage'
import { ContentReviewTabs } from '@/features/reviews/components/ContentReviewTabs'
import { useReviews } from '@/features/reviews/hooks'
import { useSeriesItem, useGlobalRating } from '../hooks'
import { SimilarContentGrid } from './SimilarContentGrid'
import { GlobalRatingBadge } from '@/shared/ui/atoms'
import { ROUTES } from '@/shared/constants'

interface SeriesDetailPageProps {
  seriesId: string
  /** groupId pre-seleccionado (navegación desde GroupDetailPage) */
  defaultGroupId?: string
  backHref?: string
}

type DialogMode = 'none' | 'create' | 'edit'

export function SeriesDetailPage({ seriesId, defaultGroupId, backHref }: SeriesDetailPageProps) {
  const { data: series, isLoading } = useSeriesItem(seriesId)
  const { data: reviews = [] } = useReviews()
  const { data: globalRating } = useGlobalRating(series?.id)
  const [dialog, setDialog] = useState<DialogMode>('none')
  const t = useTranslations('catalog.detail')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const existingReview = reviews.find((r) => r.contentId === seriesId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Link href={backHref ?? ROUTES.SERIES} className="inline-flex items-center gap-1.5 text-sm h-9 px-3 rounded-md hover:bg-accent transition-colors w-fit">
          <ArrowLeftIcon className="size-4" />
          {tCommon('back')}
        </Link>
        <p className="text-muted-foreground">{t('notFound')}</p>
      </div>
    )
  }

  const STATUS_KEY_MAP: Record<string, 'returning' | 'ended' | 'cancelled' | 'in_production'> = {
    returning_series: 'returning',
    ended: 'ended',
    canceled: 'cancelled',
    in_production: 'in_production',
    planned: 'returning', // fallback
  }
  const statusKey = STATUS_KEY_MAP[series.status] ?? 'ended'
  const seriesStatusLabel = t(`seriesStatus.${statusKey}`)

  return (
    <div className="flex flex-1 flex-col">
      {/* Backdrop */}
      {series.backdropImageUrl && (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <BackdropImage
            src={series.backdropImageUrl}
            alt={series.title}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl -mt-8 relative">
        {/* Back */}
        <Link href={backHref ?? ROUTES.SERIES} className="inline-flex items-center gap-1.5 text-sm h-9 px-3 rounded-md hover:bg-accent transition-colors w-fit">
          <ArrowLeftIcon className="size-4" />
          {tNav('series')}
        </Link>

        {/* Header */}
        <div className="flex gap-4">
          {/* Poster */}
          <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md sm:w-32">
            <CoverImage
              src={series.coverImageUrl}
              alt={series.title}
              contentType="series"
              sizes="128px"
              className="object-cover"
              iconSize="text-3xl"
              title={series.title}
            />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{series.title}</h1>
            {series.originalTitle && series.originalTitle !== series.title && (
              <p className="text-xs text-muted-foreground italic">{series.originalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{series.year}</span>
              <span>· {t('seasons', { count: series.numberOfSeasons })}</span>
              <span>· {t('episodes', { count: series.numberOfEpisodes })}</span>
              {series.originalLanguage && <span>· {series.originalLanguage.toUpperCase()}</span>}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">
                {seriesStatusLabel}
              </Badge>
              {series.genres?.map((g) => (
                <Badge key={g.id} variant="outline" className="text-[10px]">{g.name}</Badge>
              ))}
            </div>
            {globalRating && (
              <GlobalRatingBadge
                averageRating={globalRating.averageRating}
                totalReviews={globalRating.totalReviews}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Overview */}
        {series.overview && (
          <p className="text-sm text-muted-foreground leading-relaxed">{series.overview}</p>
        )}

        {/* Review section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('myReview')}
            </h2>
            {!existingReview ? (
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                {t('addReview')}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon />
                {tCommon('edit')}
              </Button>
            )}
          </div>

          {/* Tabs: Todas / Mis Grupos */}
          <ContentReviewTabs
            contentId={series.id}
            defaultGroupId={defaultGroupId}
          />
        </div>

        {/* Similar series */}
        {series.externalId && (
          <SimilarContentGrid externalId={series.externalId} contentType="series" />
        )}
      </div>

      {/* Review Editor — full-screen Notion-like */}
      {dialog !== 'none' && (
        <ReviewEditorPage
          mode={dialog === 'create' ? 'create' : 'edit'}
          review={dialog === 'edit' ? existingReview : undefined}
          initialValues={dialog === 'create' ? { contentId: series.id, contentType: 'series' } : undefined}
          contentTitle={series.title}
          onSuccess={() => setDialog('none')}
          onCancel={() => setDialog('none')}
        />
      )}
    </div>
  )
}
