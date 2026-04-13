// src/features/groups/components/GroupRankingList.tsx
'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { TrophyIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState } from '@/shared/ui/atoms'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { useCatalogItem, useCatalogItemTitle } from '@/features/catalog/hooks'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { cn } from '@/lib/utils'
import type { ReviewWithUser } from '@/entities/review/types'
import type { ContentType } from '@/shared/types'

interface GroupRankingListProps {
  reviews: ReviewWithUser[]
}

interface RankedItem {
  contentId: string
  contentType: ContentType
  reviews: ReviewWithUser[]
  avg: number
}

export function GroupRankingList({ reviews }: GroupRankingListProps) {
  const t = useTranslations('groups.detail')

  const ranked = useMemo(() => {
    const map = new Map<string, ReviewWithUser[]>()
    for (const review of reviews) {
      const key = `${review.contentType}:${review.contentId}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(review)
    }
    const items: RankedItem[] = []
    for (const [, clusterReviews] of map) {
      const rated = clusterReviews.filter((r) => r.rating != null)
      if (rated.length < 2) continue
      const avg = rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      items.push({
        contentId: clusterReviews[0].contentId,
        contentType: clusterReviews[0].contentType,
        reviews: clusterReviews,
        avg,
      })
    }
    return items.sort((a, b) => b.avg - a.avg)
  }, [reviews])

  if (ranked.length === 0) {
    return (
      <EmptyState
        icon={<TrophyIcon className="size-6" />}
        title={t('ranking.empty')}
        description={t('ranking.emptyDescription')}
      />
    )
  }

  return (
    <ol className="space-y-2">
      {ranked.map((item, index) => (
        <RankingRow
          key={`${item.contentType}:${item.contentId}`}
          rank={index + 1}
          item={item}
        />
      ))}
    </ol>
  )
}

interface RankingRowProps {
  rank: number
  item: RankedItem
}

function RankingRow({ rank, item }: RankingRowProps) {
  const t = useTranslations('groups.detail')
  const catalogItem = useCatalogItem(item.contentType, item.contentId)
  const title = useCatalogItemTitle(item.contentId, item.contentType)
  const typeLabel = CONTENT_TYPE_LABELS[item.contentType]
  const avgFormatted = item.avg % 1 === 0 ? item.avg.toString() : item.avg.toFixed(1)
  const visible = item.reviews.slice(0, 3)

  return (
    <li className={cn(
      'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors',
      rank === 1 && 'border-yellow-500/30 bg-yellow-500/5',
    )}>
      {/* Rank */}
      <span className={cn(
        'w-5 shrink-0 text-center text-sm font-bold tabular-nums',
        rank === 1 && 'text-yellow-500',
        rank === 2 && 'text-slate-400',
        rank === 3 && 'text-amber-600/80',
        rank > 3 && 'text-muted-foreground',
      )}>
        {rank}
      </span>

      {/* Cover */}
      <div className="relative shrink-0 w-9 aspect-[2/3] rounded-sm overflow-hidden border border-border/40">
        <CoverImage
          src={catalogItem?.coverImageUrl}
          alt={title ?? item.contentId}
          contentType={item.contentType}
          sizes="36px"
          className="object-cover"
          iconSize="text-base"
          title={title ?? item.contentId}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{typeLabel.icon}</span>
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-1">{title ?? item.contentId}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="flex -space-x-1">
            {visible.map((r, i) => (
              <Avatar key={i} className="size-3.5 ring-1 ring-background">
                <AvatarImage src={r.user.avatarUrl} alt={r.user.displayName} />
                <AvatarFallback className="text-[7px]">
                  {r.user.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t('reviewCount', { count: item.reviews.length })}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={cn(
          'text-lg font-bold tabular-nums leading-none',
          rank === 1 && 'text-yellow-500',
        )}>
          ★ {avgFormatted}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{t('ranking.groupScore')}</p>
      </div>
    </li>
  )
}
