// src/shared/ui/atoms/StatusBadge.tsx
'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ConsumptionStatus, ContentType } from '@/shared/types'

interface StatusBadgeProps {
  status: ConsumptionStatus
  contentType: ContentType
  className?: string
}

const statusColors: Record<ConsumptionStatus, string> = {
  consumed:        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  want_to_consume: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  consuming:       'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  dropped:         'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
}

export function StatusBadge({ status, contentType, className }: StatusBadgeProps) {
  const tStatus = useTranslations('status')
  const label = tStatus(`${status}.${contentType}`)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        statusColors[status],
        className
      )}
    >
      {label}
    </span>
  )
}
