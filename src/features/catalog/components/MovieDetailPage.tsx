// src/features/catalog/components/MovieDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, PencilIcon } from 'lucide-react'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { BackdropImage } from '@/shared/ui/atoms/BackdropImage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { ReviewEditorPage } from '@/features/reviews/components/ReviewEditorPage'
import { ContentReviewTabs } from '@/features/reviews/components/ContentReviewTabs'
import { useReviews } from '@/features/reviews/hooks'
import { useMovie } from '../hooks'

interface MovieDetailPageProps {
  movieId: string
  /** groupId pre-seleccionado (navegación desde GroupDetailPage) */
  defaultGroupId?: string
}

type DialogMode = 'none' | 'create' | 'edit'

export function MovieDetailPage({ movieId, defaultGroupId }: MovieDetailPageProps) {
  const router = useRouter()
  const { data: movie, isLoading } = useMovie(movieId)
  const { data: reviews = [] } = useReviews()
  const [dialog, setDialog] = useState<DialogMode>('none')
  const t = useTranslations('catalog.detail')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const existingReview = reviews.find((r) => r.contentId === movieId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          {tCommon('back')}
        </Button>
        <p className="text-muted-foreground">{t('notFound')}</p>
      </div>
    )
  }

  const runtimeFormatted = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null

  return (
    <div className="flex flex-1 flex-col">
      {/* Backdrop */}
      {movie.backdropImageUrl && (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <BackdropImage
            src={movie.backdropImageUrl}
            alt={movie.title}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl -mt-8 relative">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          {tNav('movies')}
        </Button>

        {/* Header */}
        <div className="flex gap-4">
          {/* Poster */}
          <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md sm:w-32">
            <CoverImage
              src={movie.coverImageUrl}
              alt={movie.title}
              contentType="movie"
              sizes="128px"
              className="object-cover"
              iconSize="text-3xl"
              title={movie.title}
            />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-muted-foreground italic">{movie.originalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{movie.year}</span>
              {runtimeFormatted && <span>· {runtimeFormatted}</span>}
              {movie.originalLanguage && <span>· {movie.originalLanguage.toUpperCase()}</span>}
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.genres?.map((g) => (
                <Badge key={g.id} variant="outline" className="text-[10px]">{g.name}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {movie.overview && (
          <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
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
            contentId={movie.id}
            defaultGroupId={defaultGroupId}
          />
        </div>
      </div>

      {/* Review Editor — full-screen Notion-like */}
      {dialog !== 'none' && (
        <ReviewEditorPage
          mode={dialog === 'create' ? 'create' : 'edit'}
          review={dialog === 'edit' ? existingReview : undefined}
          initialValues={dialog === 'create' ? { contentId: movie.id, contentType: 'movie' } : undefined}
          contentTitle={movie.title}
          onSuccess={() => setDialog('none')}
          onCancel={() => setDialog('none')}
        />
      )}
    </div>
  )
}
