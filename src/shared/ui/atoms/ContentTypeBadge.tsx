// src/shared/ui/atoms/ContentTypeBadge.tsx
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'

interface ContentTypeBadgeProps {
  contentType: ContentType
  showIcon?: boolean
  className?: string
}

export function ContentTypeBadge({ contentType, showIcon = true, className }: ContentTypeBadgeProps) {
  const label = CONTENT_TYPE_LABELS[contentType]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      {showIcon && <span aria-hidden>{label.icon}</span>}
      <span>{label.en}</span>
    </span>
  )
}
