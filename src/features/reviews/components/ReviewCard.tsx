'use client'

import { PencilIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { formatDate } from '@/shared/utils'
import type { Review } from '@/entities/review/types'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
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
      {review.rating && <RatingStars value={review.rating} readonly size="sm" />}

      {/* Title */}
      {review.title && (
        <p className="font-medium text-sm leading-snug">{review.title}</p>
      )}

      {/* Body */}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {review.body}
        </p>
      )}

      {/* Footer */}
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>ID: <code className="font-mono">{review.contentId}</code></span>
        <span>{formatDate(review.createdAt)}</span>
      </div>
    </div>
  )
}
