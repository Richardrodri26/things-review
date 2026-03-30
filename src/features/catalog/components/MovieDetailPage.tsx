// src/features/catalog/components/MovieDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, PlusIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ReviewEditorPage } from '@/features/reviews/components/ReviewEditorPage'
import { useStore } from '@/shared/lib/store'
import { useDeleteReview } from '@/features/reviews/hooks'
import { useMovie } from '../hooks'

interface MovieDetailPageProps {
  movieId: string
}

type DialogMode = 'none' | 'create' | 'edit'

export function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const router = useRouter()
  const { data: movie, isLoading } = useMovie(movieId)
  const reviews = useStore((s) => s.reviews)
  const deleteReview = useDeleteReview()
  const [dialog, setDialog] = useState<DialogMode>('none')

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
          Back
        </Button>
        <p className="text-muted-foreground">Movie not found.</p>
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
          <Image
            src={movie.backdropImageUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl -mt-8 relative">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Movies
        </Button>

        {/* Header */}
        <div className="flex gap-4">
          {/* Poster */}
          {movie.coverImageUrl && (
            <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md sm:w-32">
              <Image
                src={movie.coverImageUrl}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          )}

          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-muted-foreground italic">{movie.originalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{movie.year}</span>
              {runtimeFormatted && <span>· {runtimeFormatted}</span>}
              <span>· {movie.originalLanguage.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.genres.map((g) => (
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
              My Review
            </h2>
            {!existingReview ? (
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                Add Review
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon />
                Edit
              </Button>
            )}
          </div>

          {existingReview ? (
            <ReviewCard
              review={existingReview}
              onDelete={async (r) => {
                await deleteReview.mutateAsync(r.id)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You haven&apos;t reviewed this movie yet.</p>
          )}
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
