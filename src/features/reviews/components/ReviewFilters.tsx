// src/features/reviews/components/ReviewFilters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS, CONSUMPTION_STATUS_LABELS } from '@/shared/types'
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
  const hasFilters = selectedContentTypes.length > 0 || selectedStatuses.length > 0
  const isFiltered = hasFilters && totalResults < totalReviews

  return (
    <div className="space-y-3">
      {/* Content Type filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Type:</span>
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
              {label.en}
            </Button>
          )
        })}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
        {STATUS_LIST.map((status) => {
          // Usamos 'movie' como proxy para el label genérico
          const label = CONSUMPTION_STATUS_LABELS[status]['movie'].en
          const isActive = selectedStatuses.includes(status)
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => onStatusToggle(status)}
              className={cn(isActive && 'shadow-none')}
            >
              {label}
            </Button>
          )
        })}
      </div>

      {/* Clear + result count */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isFiltered ? `${totalResults} of ${totalReviews} reviews` : `${totalReviews} reviews`}
          </span>
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
