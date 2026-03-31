'use client'

import { useTranslations } from 'next-intl'
import {
  CalendarIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { ContentTypeBadge } from '@/shared/ui/atoms'
import { formatDate } from '@/shared/utils'
import { useCatalogItem } from '@/features/catalog/hooks/useCatalog'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import type { WatchlistItem, WatchlistPriority } from '@/entities/watchlist/types'
import { cn } from '@/lib/utils'

interface WatchlistCardProps {
  item: WatchlistItem
  onEdit?: (item: WatchlistItem, title: string) => void
  onRemove?: (item: WatchlistItem, title: string) => void
  onMarkAsConsumed?: (item: WatchlistItem, title: string) => void
}

const PRIORITY_VARIANT: Record<WatchlistPriority, 'destructive' | 'default' | 'outline'> = {
  high: 'destructive',
  medium: 'default',
  low: 'outline',
}

const PRIORITY_DOT: Record<WatchlistPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-muted-foreground/50',
}

function isOverdue(targetDate?: Date): boolean {
  if (!targetDate) return false
  return new Date(targetDate) < new Date()
}

export function WatchlistCard({ item, onEdit, onRemove, onMarkAsConsumed }: WatchlistCardProps) {
  const t = useTranslations('watchlist')
  const itemTitle = useCatalogItemTitle(item.contentId)
  const catalogItem = useCatalogItem(item.contentType, item.contentId)
  const overdue = isOverdue(item.targetDate)

  const title = itemTitle ?? item.contentId

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">

      {/* ── Poster area ─────────────────────────────────────────────── */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <CoverImage
          src={catalogItem?.coverImageUrl}
          alt={title}
          contentType={item.contentType}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          iconSize="text-4xl"
          title={title}
        />

        {/* Gradient overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Top-left — content type + overdue */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <ContentTypeBadge contentType={item.contentType} />
          {overdue && (
            <Badge className="gap-1 bg-red-600 text-white border-transparent shadow-sm">
              <AlertCircleIcon className="size-3" />
              {t('card.overdue')}
            </Badge>
          )}
        </div>

        {/* Top-right — priority indicator */}
        <div className="absolute top-2.5 right-2.5">
          <Badge
            variant={PRIORITY_VARIANT[item.priority]}
            className="gap-1.5 shadow-sm"
          >
            <span className={cn('size-1.5 rounded-full', PRIORITY_DOT[item.priority])} aria-hidden />
            {t(`card.priority.${item.priority}` as `card.priority.high`)}
          </Badge>
        </div>

        {/* Action buttons — hover overlay, top-right stacked below priority */}
        <div className="absolute top-9 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onMarkAsConsumed && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onMarkAsConsumed(item, title)}
              aria-label={t('card.consumeAriaLabel')}
              className="size-7 shadow-sm"
            >
              <CheckIcon className="size-3.5" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onEdit(item, title)}
              aria-label={t('card.editAriaLabel')}
              className="size-7 shadow-sm"
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onRemove(item, title)}
              aria-label={t('card.removeAriaLabel')}
              className="size-7 shadow-sm text-destructive hover:text-destructive"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Bottom overlay — title */}
        <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pointer-events-none">
          <p className="text-sm font-semibold text-white leading-tight line-clamp-2 drop-shadow-sm">
            {title}
          </p>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {item.targetDate ? (
          <span className={cn('flex items-center gap-1', overdue && 'text-destructive font-medium')}>
            <CalendarIcon className="size-3 shrink-0" />
            {formatDate(item.targetDate)}
          </span>
        ) : (
          <span className="truncate">
            {t('card.added', { date: formatDate(item.addedAt) })}
          </span>
        )}

        {item.note && (
          <span
            className="shrink-0 max-w-[55%] truncate text-muted-foreground/70 italic"
            title={item.note}
          >
            {item.note}
          </span>
        )}
      </div>
    </div>
  )
}
