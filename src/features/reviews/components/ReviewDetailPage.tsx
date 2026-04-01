'use client'

// src/features/reviews/components/ReviewDetailPage.tsx

import { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeOffIcon,
  CalendarIcon,
  MessageSquareIcon,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { EditorRenderer } from '@/components/editor/editor-renderer'
import { CommentList } from '@/features/comments/components'
import { ReviewEditorPage } from './ReviewEditorPage'
import { ROUTES } from '@/shared/constants'
import { formatDate } from '@/shared/utils'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import { useReviewById, useDeleteReview } from '../hooks'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

// Grupo por defecto para comentarios sin contexto de grupo real
const DEFAULT_GROUP_ID = 'personal'

interface ReviewDetailPageProps {
  reviewId: string
  backHref?: string
}

export function ReviewDetailPage({ reviewId, backHref }: ReviewDetailPageProps) {
  const t = useTranslations('reviews.detail')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const router = useRouter()
  const { data: review, isLoading } = useReviewById(reviewId)
  // Use catalogItem embedded in the review as primary source (always available).
  // Fall back to useCatalogItemTitle only if catalogItem is missing (e.g. old data).
  const fallbackTitle = useCatalogItemTitle(review?.contentId ?? '', review?.contentType)
  const itemTitle = review?.catalogItem?.title ?? fallbackTitle
  const coverImageUrl = review?.catalogItem?.coverImageUrl
  const deleteReview = useDeleteReview({
    deleted: tToasts('reviews.deleted'),
    deletedError: tToasts('reviews.deletedError'),
    deletedErrorDescription: tToasts('tryAgain'),
  })
  const { data: session } = useSession()
  const isOwner = session?.user?.id === review?.userId
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteReview.mutateAsync(reviewId)
    router.replace(ROUTES.REVIEWS)
  }

  if (isLoading) return <ReviewDetailSkeleton />
  // isDeleting guards against notFound() firing while router.replace() is in-flight
  if (!review) {
    if (isDeleting) return <ReviewDetailSkeleton />
    notFound()
  }

  const hasBody = review.body?.blocks && review.body.blocks.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* ── Editor overlay ────────────────────────────── */}
      {isEditing && (
        <ReviewEditorPage
          mode="edit"
          review={review}
          contentTitle={itemTitle ?? undefined}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* ── Sticky top nav ───────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link
            href={backHref ?? ROUTES.REVIEWS}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              '-ml-2 text-muted-foreground hover:text-foreground',
            )}
          >
            <ArrowLeftIcon className="size-4 mr-1.5" />
            {t('breadcrumb')}
          </Link>

          {isOwner && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <PencilIcon className="size-3.5 mr-1.5" />
                {tCommon('edit')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="size-3.5 mr-1.5" />
                      {tCommon('delete')}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteDialog.description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive">
                      {tCommon('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* ── Article ───────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-6 pt-12 pb-28">

        {/* Header */}
        <header className="mb-10">
          {/* Poster + Info layout */}
          <div className="flex gap-5 sm:gap-7">
            {/* Poster */}
            <div className="relative shrink-0 w-24 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden border border-border/60 shadow-lg">
              <CoverImage
                src={coverImageUrl}
                alt={itemTitle ?? ''}
                contentType={review.contentType}
                sizes="128px"
                className="object-cover"
                iconSize="text-3xl"
                title={itemTitle ?? review.contentId}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4 pt-1">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <ContentTypeBadge contentType={review.contentType} />
                <StatusBadge status={review.status} contentType={review.contentType} />
                {review.containsSpoilers && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-amber-600 border-amber-400/50 text-xs"
                  >
                    <EyeOffIcon className="size-3" />
                    {t('spoilers')}
                  </Badge>
                )}
              </div>

              {/* Content subtitle */}
              {itemTitle && (
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                  {itemTitle}
                </p>
              )}

              {/* Review title — large, editorial */}
              <h1 className="text-2xl sm:text-4xl font-bold leading-[1.15] tracking-tight text-foreground">
                {review.title ?? `Review of ${itemTitle ?? review.contentId}`}
              </h1>

              {/* Rating */}
              {review.rating && (
                <div className="pt-1">
                  <RatingStars value={review.rating} readonly size="lg" showValue />
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3" />
                  {formatDate(review.createdAt)}
                </span>
                {review.updatedAt > review.createdAt && (
                  <span className="italic">
                    {t('editedAt', { date: formatDate(review.updatedAt) })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <Separator className="mb-10 opacity-50" />

        {/* ── Body ─────────────────────────────────────── */}
        {hasBody ? (
          <section className="mb-16">
            {review.containsSpoilers && !showSpoilers && !isOwner ? (
              <SpoilerGate onReveal={() => setShowSpoilers(true)} />
            ) : (
              <EditorRenderer data={review.body!} />
            )}
          </section>
        ) : (
          <p className="text-muted-foreground/50 italic text-sm mb-16">
            {t('noWrittenReview')}
          </p>
        )}

        {/* ── Comments ─────────────────────────────────── */}
        <div className="border-t border-border/40 pt-12">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquareIcon className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              {t('discussion')}
            </h2>
          </div>
          <CommentList reviewId={reviewId} groupId={DEFAULT_GROUP_ID} />
        </div>
      </article>
    </div>
  )
}

// ── Spoiler Gate ─────────────────────────────────────────────
function SpoilerGate({ onReveal }: { onReveal: () => void }) {
  const t = useTranslations('reviews.detail')
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-50/10 dark:bg-amber-950/10 p-12 text-center space-y-4">
      <div className="text-4xl select-none">⚠️</div>
      <div className="space-y-2">
        <p className="font-semibold text-foreground">{t('spoilerWarning')}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {t('spoilerHint')}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onReveal}
        className="mt-2 border-amber-300/40 hover:bg-amber-50/20"
      >
        <EyeOffIcon className="size-3.5 mr-1.5" />
        {t('revealAnyway')}
      </Button>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function ReviewDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 h-12" />
      <div className="max-w-3xl mx-auto px-6 pt-12 space-y-5">
        {/* Poster + info skeleton */}
        <div className="flex gap-5 sm:gap-7">
          <Skeleton className="w-24 sm:w-32 aspect-[2/3] rounded-xl shrink-0" />
          <div className="flex-1 space-y-4 pt-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Separator className="opacity-50" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  )
}
