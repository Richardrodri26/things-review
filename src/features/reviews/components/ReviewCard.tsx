'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PencilIcon, TrashIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RatingStars, ContentTypeBadge, StatusBadge, ReactionButton, ReputationBadge } from '@/shared/ui/atoms'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { formatDate } from '@/shared/utils'
import { useCatalogItem } from '@/features/catalog/hooks/useCatalog'
import { useComments } from '@/features/comments/hooks/useComments'
import { useReviewReactions, useToggleReviewReaction } from '@/features/reactions'
import { useReputation } from '@/features/reputation'
import { ROUTES } from '@/shared/constants'
import { extractPlainText } from '@/components/editor/editor-client'
import { useSession } from '@/lib/auth-client'
import type { Review } from '@/entities/review/types'
import type { User } from '@/entities/user/types'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
  author?: Pick<User, 'id' | 'username'> & { displayName?: string | null; avatarUrl?: string }
  isOwn?: boolean
  /** Href override for the card link. Defaults to ROUTES.REVIEW_DETAIL(review.id) */
  detailHref?: string
}

export function ReviewCard({ review, onEdit, onDelete, author, isOwn, detailHref }: ReviewCardProps) {
  const t = useTranslations('reviews.card')
  const tReactions = useTranslations('reactions')
  const localCatalogItem = useCatalogItem(review.contentType, review.contentId)
  const resolvedItem = review.catalogItem ?? localCatalogItem
  const itemTitle = resolvedItem?.title ?? review.contentId
  const { data: comments = [] } = useComments(review.id)
  const { data: session } = useSession()
  const { data: reactions } = useReviewReactions(review.id)
  const toggleReaction = useToggleReviewReaction(review.id)
  const { data: authorReputation } = useReputation(author?.id)

  // Only top-level comments (no replies) count toward the badge
  const commentCount = comments.filter((c) => !c.parentId).length
  const bodyPreview = review.body ? extractPlainText(review.body) : undefined
  const isAuthenticated = !!session?.user

  return (
    <Link
      href={detailHref ?? ROUTES.REVIEW_DETAIL(review.id)}
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer"
    >

      {/* ── Poster area ─────────────────────────────────────────────── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <CoverImage
          src={resolvedItem?.coverImageUrl}
          alt={itemTitle ?? ''}
          contentType={review.contentType}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          iconSize="text-6xl"
          title={itemTitle ?? review.contentId}
        />

        {/* Gradient overlay — taller so badges always have legible bg */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Edit / Delete — top-right, floating, revealed on hover */}
        {(onEdit || onDelete) && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            {onEdit && (
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={(e) => { e.preventDefault(); onEdit(review) }}
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
                onClick={(e) => { e.preventDefault(); onDelete(review) }}
                aria-label={t('deleteAriaLabel')}
                className="size-7 shadow-sm text-destructive hover:text-destructive"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Badges + Rating — bottom of poster, single row, no wrapping */}
        <div className="absolute bottom-2 inset-x-2 flex items-end justify-between gap-1 min-w-0">
          {/* Left: type + status badges stacked vertically, both compact */}
          <div className="flex flex-col gap-1 items-start min-w-0 overflow-hidden">
            <ContentTypeBadge
              contentType={review.contentType}
              className="text-[10px] px-1.5 py-0 leading-5 border-white/20 bg-black/40 text-white backdrop-blur-sm"
            />
            <StatusBadge
              status={review.status}
              contentType={review.contentType}
              className="text-[10px] px-1.5 py-0 leading-5"
            />
          </div>
          {/* Right: rating */}
          {review.rating && (
            <div className="shrink-0">
              <RatingStars value={review.rating} readonly size="sm" showValue />
            </div>
          )}
        </div>
      </div>

      {/* ── Info area ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 p-2.5">
        {/* Content title — always 1 line */}
        <p className="text-xs font-semibold leading-snug line-clamp-1 text-foreground">
          {itemTitle ?? review.contentId}
        </p>

        {/*
          Subtitle slot — ALWAYS rendered with fixed height so all cards in a
          grid stay the same height regardless of whether there's a review title
          or body preview. h-8 ≈ 2 lines of text-[11px] leading-relaxed.
        */}
        <div className="h-8 overflow-hidden">
          {review.title ? (
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 italic">
              &ldquo;{review.title}&rdquo;
            </p>
          ) : bodyPreview ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {bodyPreview}
            </p>
          ) : null}
        </div>

        {/* Footer: author/date + comment count + reactions — all in one compact row */}
        <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-muted-foreground">
          {/* Left: author or date */}
          <span className="flex items-center gap-1 min-w-0 overflow-hidden">
            {author ? (
              isOwn ? (
                <span className="font-medium text-primary shrink-0">{t('you')}</span>
              ) : (
                <Link
                  href={ROUTES.PUBLIC_PROFILE(author.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 min-w-0 hover:text-primary transition-colors"
                >
                  <Avatar size="sm" className="size-4 shrink-0">
                    <AvatarImage src={author.avatarUrl} alt={author.displayName ?? author.username} />
                    <AvatarFallback>{(author.displayName ?? author.username ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{author.displayName ?? author.username}</span>
                  {authorReputation && (
                    <ReputationBadge
                      score={authorReputation.score}
                      tier={authorReputation.tier}
                      variant="inline"
                    />
                  )}
                </Link>
              )
            ) : (
              <span className="truncate">{formatDate(review.createdAt)}</span>
            )}
          </span>

          {/* Right: comment count */}
          <span className="flex items-center gap-1 shrink-0">
            {author && <span>{formatDate(review.createdAt)}</span>}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquareIcon className="size-3" />
                {commentCount}
              </span>
            )}
          </span>
        </div>

        {/* Reactions — compact, always last */}
        <div className="flex items-center gap-1 mt-1">
          <ReactionButton
            type="like"
            count={reactions?.likeCount ?? 0}
            isActive={reactions?.userReaction === 'like'}
            onClick={() => toggleReaction.mutate('like')}
            disabled={!isAuthenticated}
            label={tReactions('like')}
            showCountAlways
          />
          <ReactionButton
            type="dislike"
            count={reactions?.dislikeCount ?? 0}
            isActive={reactions?.userReaction === 'dislike'}
            onClick={() => toggleReaction.mutate('dislike')}
            disabled={!isAuthenticated}
            label={tReactions('dislike')}
            showCountAlways
          />
        </div>
      </div>
    </Link>
  )
}
