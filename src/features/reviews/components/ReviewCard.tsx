'use client'

import Link from 'next/link'
import { PencilIcon, TrashIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { formatDate } from '@/shared/utils'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import { ROUTES } from '@/shared/constants'
import { extractPlainText } from '@/components/editor/editor-client'
import type { Review } from '@/entities/review/types'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const itemTitle = useCatalogItemTitle(review.contentId)

  // Extraer preview de texto plano del cuerpo EditorJS
  const bodyPreview = review.body ? extractPlainText(review.body) : undefined

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ContentTypeBadge contentType={review.contentType} />
          <StatusBadge status={review.status} contentType={review.contentType} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(review)}
              aria-label="Edit review"
            >
              <PencilIcon />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(review)}
              aria-label="Delete review"
              className="text-destructive hover:text-destructive"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>

      {/* Rating */}
      {review.rating && <RatingStars value={review.rating} readonly size="sm" showValue />}

      {/* Title */}
      {review.title && (
        <p className="font-medium text-sm leading-snug">{review.title}</p>
      )}

      {/* Body preview */}
      {bodyPreview && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {bodyPreview}
        </p>
      )}

      {/* Footer */}
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[60%]">{itemTitle ?? review.contentId}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span>{formatDate(review.createdAt)}</span>
          <Link
            href={ROUTES.REVIEW_DETAIL(review.id)}
            className="inline-flex items-center gap-0.5 text-foreground hover:text-primary transition-colors"
            aria-label="View full review"
          >
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
