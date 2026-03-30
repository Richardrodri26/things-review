'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PencilIcon, TrashIcon, ArrowRightIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { formatDate } from '@/shared/utils'
import { useCatalogItem } from '@/features/catalog/hooks/useCatalog'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import { useComments } from '@/features/comments/hooks/useComments'
import { ROUTES } from '@/shared/constants'
import { extractPlainText } from '@/components/editor/editor-client'
import type { Review } from '@/entities/review/types'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const t = useTranslations('reviews.card')
  const itemTitle = useCatalogItemTitle(review.contentId)
  const catalogItem = useCatalogItem(review.contentType, review.contentId)
  const { data: comments = [] } = useComments(review.id)

  const commentCount = comments.filter((c) => !c.parentId).length
  const bodyPreview = review.body ? extractPlainText(review.body) : undefined

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">

      {/* ── Poster area ─────────────────────────────────────────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <CoverImage
          src={catalogItem?.coverImageUrl}
          alt={itemTitle ?? ''}
          contentType={review.contentType}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          iconSize="text-6xl"
          title={itemTitle ?? review.contentId}
        />

        {/* Gradient overlay — bottom for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* Badges — top-left, floating over image */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <ContentTypeBadge contentType={review.contentType} />
          <StatusBadge status={review.status} contentType={review.contentType} />
        </div>

        {/* Edit / Delete — top-right, floating */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onEdit && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onEdit(review)}
              aria-label={t('editAriaLabel')}
              className="size-7 shadow-sm"
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onDelete(review)}
              aria-label={t('deleteAriaLabel')}
              className="size-7 shadow-sm text-destructive hover:text-destructive"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Rating — bottom-left, over gradient */}
        {review.rating && (
          <div className="absolute bottom-2.5 left-2.5">
            <RatingStars value={review.rating} readonly size="sm" showValue />
          </div>
        )}

        {/* View link — bottom-right */}
        <Link
          href={ROUTES.REVIEW_DETAIL(review.id)}
          className="absolute bottom-2.5 right-2.5 inline-flex items-center justify-center size-6 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/35 transition-colors"
          aria-label={t('viewAriaLabel')}
        >
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      {/* ── Info area ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Content title */}
        <p className="text-xs font-semibold leading-snug line-clamp-1 text-foreground">
          {itemTitle ?? review.contentId}
        </p>

        {/* Review title */}
        {review.title && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-1 italic">
            &ldquo;{review.title}&rdquo;
          </p>
        )}

        {/* Body preview */}
        {bodyPreview && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
            {bodyPreview}
          </p>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{formatDate(review.createdAt)}</span>
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquareIcon className="size-3" />
              {commentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
