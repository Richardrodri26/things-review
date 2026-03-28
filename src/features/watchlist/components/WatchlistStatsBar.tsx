import { AlertCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { WatchlistStats } from '@/entities/watchlist/types'

interface WatchlistStatsBarProps {
  stats: WatchlistStats
}

export function WatchlistStatsBar({ stats }: WatchlistStatsBarProps) {
  const topTypes = (
    Object.entries(stats.byContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][]
  )
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
      {/* Total */}
      <Badge variant="secondary">
        {stats.total} total
      </Badge>

      {/* By priority */}
      {stats.byPriority.high > 0 && (
        <Badge variant="destructive">
          {stats.byPriority.high} high
        </Badge>
      )}
      {stats.byPriority.medium > 0 && (
        <Badge variant="default">
          {stats.byPriority.medium} medium
        </Badge>
      )}
      {stats.byPriority.low > 0 && (
        <Badge variant="outline">
          {stats.byPriority.low} low
        </Badge>
      )}

      {/* By content type */}
      {topTypes.length > 0 && (
        <>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          {topTypes.map(([type, count]) => (
            <Badge key={type} variant="outline">
              <span aria-hidden>{CONTENT_TYPE_LABELS[type].icon}</span>
              {count}
            </Badge>
          ))}
        </>
      )}

      {/* Overdue warning */}
      {stats.overdueCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <Badge variant="destructive">
            <AlertCircleIcon data-icon="inline-start" />
            {stats.overdueCount} overdue
          </Badge>
        </>
      )}
    </div>
  )
}
