// src/features/reviews/components/ContentReviewGroup.tsx
'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { StarIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState } from '@/shared/ui/atoms'
import { ReviewCard } from './ReviewCard'
import { useUser } from '@/shared/lib/store'
import { useCatalogItem, useCatalogItemTitle } from '@/features/catalog/hooks'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { ROUTES } from '@/shared/constants'
import type { ReviewWithUser } from '@/entities/review/types'
import type { ContentType } from '@/shared/types'

interface ContentReviewGroupProps {
  reviews: ReviewWithUser[]
  groupId?: string
}

/**
 * Muestra las reseñas del grupo agrupadas por contenido.
 * Cada contenido tiene un cluster con: poster thumb, título, promedio del grupo,
 * y todas las ReviewCards de los miembros.
 */
export function ContentReviewGroup({ reviews, groupId }: ContentReviewGroupProps) {
  const t = useTranslations('groups.detail')
  const user = useUser()

  // Agrupa las reseñas por contentType:contentId
  const groups = useMemo(() => {
    const map = new Map<string, ReviewWithUser[]>()
    for (const review of reviews) {
      const key = `${review.contentType}:${review.contentId}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(review)
    }
    // Ordena: contenidos con más reseñas primero (más conversación = más arriba)
    return Array.from(map.values()).sort((a, b) => b.length - a.length)
  }, [reviews])

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<StarIcon className="size-6" />}
        title={t('noReviews')}
        description={t('noReviewsDescription')}
      />
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((groupReviews) => {
        const first = groupReviews[0]
        return (
          <ContentCluster
            key={`${first.contentType}:${first.contentId}`}
            contentId={first.contentId}
            contentType={first.contentType}
            reviews={groupReviews}
            currentUserId={user?.id}
            groupId={groupId}
          />
        )
      })}
    </div>
  )
}

// ── Cluster de un contenido específico ──────────────────────────────────────
interface ContentClusterProps {
  contentId: string
  contentType: ContentType
  reviews: ReviewWithUser[]
  currentUserId?: string
  groupId?: string
}

function ContentCluster({ contentId, contentType, reviews, currentUserId, groupId }: ContentClusterProps) {
  const t = useTranslations('groups.detail')
  const catalogItem = useCatalogItem(contentType, contentId)
  const title = useCatalogItemTitle(contentId, contentType)

  const rated = reviews.filter((r) => r.rating != null)
  const avg = rated.length >= 2
    ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
    : null
  const avgFormatted = avg != null
    ? (avg % 1 === 0 ? avg.toString() : avg.toFixed(1))
    : null

  const typeLabel = CONTENT_TYPE_LABELS[contentType]

  return (
    <div className="space-y-3">
      {/* ── Cluster header ── */}
      <div className="flex items-center gap-3">
        {/* Mini poster */}
        <div className="relative shrink-0 w-10 aspect-[2/3] rounded-md overflow-hidden border border-border/60 shadow-sm">
          <CoverImage
            src={catalogItem?.coverImageUrl}
            alt={title ?? contentId}
            contentType={contentType}
            sizes="40px"
            className="object-cover"
            iconSize="text-lg"
            title={title ?? contentId}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Tipo + título */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-muted-foreground">
              {typeLabel.icon} {typeLabel.en}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug line-clamp-1">
            {title ?? contentId}
          </p>

          {/* Metadatos: n reseñas + promedio */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>
              {t('reviewCount', { count: reviews.length })}
            </span>
            {avgFormatted && (
              <>
                <span className="opacity-40">·</span>
                <GroupAvatarStack reviews={reviews} />
                <span className="flex items-center gap-0.5 font-medium text-foreground">
                  ★ {avgFormatted}
                  <span className="font-normal text-muted-foreground ml-0.5">
                    {t('groupAvg')}
                  </span>
                </span>
              </>
            )}
            {!avgFormatted && reviews.length > 1 && (
              <>
                <span className="opacity-40">·</span>
                <GroupAvatarStack reviews={reviews} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ReviewCards del grupo ── */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(130px,1fr))] pl-0">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            author={review.user}
            isOwn={review.userId === currentUserId}
            detailHref={
              groupId
                ? `${ROUTES.REVIEW_DETAIL(review.id)}?from=${ROUTES.GROUP_DETAIL(groupId)}`
                : undefined
            }
          />
        ))}
      </div>

      {/* Separador decorativo entre grupos */}
      <div className="border-b border-border/30" />
    </div>
  )
}

// ── Avatars apilados de los autores ────────────────────────────────────────
function GroupAvatarStack({ reviews }: { reviews: ReviewWithUser[] }) {
  const visible = reviews.slice(0, 3)
  return (
    <span className="flex -space-x-1">
      {visible.map((r, i) => (
        <Avatar key={i} className="size-4 ring-1 ring-background">
          <AvatarImage src={r.user.avatarUrl} alt={r.user.displayName} />
          <AvatarFallback className="text-[8px]">
            {r.user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </span>
  )
}
