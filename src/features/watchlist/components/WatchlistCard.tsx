'use client'

import { useTranslations } from 'next-intl'
import { CalendarIcon, CheckIcon, PencilIcon, TrashIcon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card'
import { ContentTypeBadge } from '@/shared/ui/atoms'
import { formatDate } from '@/shared/utils'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import type { WatchlistItem, WatchlistPriority } from '@/entities/watchlist/types'

interface WatchlistCardProps {
  item: WatchlistItem
  onEdit?: (item: WatchlistItem) => void
  onRemove?: (item: WatchlistItem) => void
  onMarkAsConsumed?: (item: WatchlistItem) => void
}

const PRIORITY_VARIANT: Record<WatchlistPriority, 'destructive' | 'default' | 'outline'> = {
  high:   'destructive',
  medium: 'default',
  low:    'outline',
}

function isOverdue(targetDate?: Date): boolean {
  if (!targetDate) return false
  return new Date(targetDate) < new Date()
}

export function WatchlistCard({ item, onEdit, onRemove, onMarkAsConsumed }: WatchlistCardProps) {
  const t = useTranslations('watchlist')
  const itemTitle = useCatalogItemTitle(item.contentId)
  const overdue = isOverdue(item.targetDate)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate">
          {itemTitle ?? item.contentId}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <ContentTypeBadge contentType={item.contentType} />
          <Badge variant={PRIORITY_VARIANT[item.priority]}>
            {t(`card.priority.${item.priority}` as `card.priority.high`)}
          </Badge>
          {overdue && (
            <Badge variant="destructive">
              <AlertCircleIcon data-icon="inline-start" />
              {t('card.overdue')}
            </Badge>
          )}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-0.5">
            {onMarkAsConsumed && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onMarkAsConsumed(item)}
                aria-label={t('card.consumeAriaLabel')}
              >
                <CheckIcon />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(item)}
                aria-label={t('card.editAriaLabel')}
              >
                <PencilIcon />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(item)}
                aria-label={t('card.removeAriaLabel')}
                className="text-destructive hover:text-destructive"
              >
                <TrashIcon />
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>

      {item.note && (
        <CardContent>
          <p className="text-xs/relaxed text-muted-foreground line-clamp-2">
            {item.note}
          </p>
        </CardContent>
      )}

      <CardFooter className="text-xs text-muted-foreground">
        {item.targetDate ? (
          <span className="flex items-center gap-1">
            <CalendarIcon data-icon="inline-start" />
            {formatDate(item.targetDate)}
          </span>
        ) : (
          <span>{t('card.added', { date: formatDate(item.addedAt) })}</span>
        )}
      </CardFooter>
    </Card>
  )
}
