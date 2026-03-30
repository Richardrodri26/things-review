// src/features/reviews/components/ReviewFilters.tsx
'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType, ConsumptionStatus } from '@/shared/types'

// Usamos 'movie' como proxy para los labels genéricos de status
const STATUS_LIST: ConsumptionStatus[] = ['consumed', 'consuming', 'want_to_consume', 'dropped']
const CONTENT_TYPE_LIST: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

interface ReviewFiltersProps {
  selectedContentTypes: ContentType[]
  selectedStatuses: ConsumptionStatus[]
  onContentTypeToggle: (ct: ContentType) => void
  onStatusToggle: (status: ConsumptionStatus) => void
  onClearAll: () => void
  totalResults: number
  totalReviews: number
}

export function ReviewFilters({
  selectedContentTypes,
  selectedStatuses,
  onContentTypeToggle,
  onStatusToggle,
  onClearAll,
  totalResults,
  totalReviews,
}: ReviewFiltersProps) {
  const t = useTranslations('reviews.filters')
  const tContentType = useTranslations('contentType')
  const tStatusOptions = useTranslations('reviews.editor.statusOptions')
  const tCommon = useTranslations('common')
  const hasFilters = selectedContentTypes.length > 0 || selectedStatuses.length > 0
  const isFiltered = hasFilters && totalResults < totalReviews

  return (
    <div className="space-y-3">
      {/* Content Type filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t('type')}</span>
        {CONTENT_TYPE_LIST.map((ct) => {
          const label = CONTENT_TYPE_LABELS[ct]
          const isActive = selectedContentTypes.includes(ct)
          return (
            <Button
              key={ct}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => onContentTypeToggle(ct)}
              className={cn('gap-1', isActive && 'shadow-none')}
            >
              <span aria-hidden>{label.icon}</span>
              {tContentType(ct)}
            </Button>
          )
        })}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t('status')}</span>
        {STATUS_LIST.map((status) => {
          const isActive = selectedStatuses.includes(status)
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => onStatusToggle(status)}
              className={cn(isActive && 'shadow-none')}
            >
              {tStatusOptions(status)}
            </Button>
          )
        })}
      </div>

      {/* Clear + result count */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isFiltered
              ? t('count', { filtered: totalResults, total: totalReviews })
              : t('countAll', { count: totalReviews })}
          </span>
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            {tCommon('clearFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}
