'use client'

import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactionType } from '@/entities/reaction/types'

interface ReactionButtonProps {
  type: ReactionType
  count: number
  isActive: boolean
  onClick: () => void
  disabled?: boolean
  label?: string
  /** Always render the count span — use invisible when 0 to maintain consistent height */
  showCountAlways?: boolean
  className?: string
}

const config = {
  like: {
    Icon: ThumbsUp,
    activeClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    hoverClass: 'hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30',
    label: 'Like',
  },
  dislike: {
    Icon: ThumbsDown,
    activeClass: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    hoverClass: 'hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30',
    label: 'Dislike',
  },
}

export function ReactionButton({ type, count, isActive, onClick, disabled, label, showCountAlways, className }: ReactionButtonProps) {
  const { Icon, activeClass, hoverClass, label: defaultLabel } = config[type]
  const resolvedLabel = label ?? defaultLabel

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick() }}
      disabled={disabled}
      aria-label={`${resolvedLabel}${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={isActive}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        'transition-all duration-150',
        'text-muted-foreground border-border bg-transparent',
        !disabled && hoverClass,
        isActive && activeClass,
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {(count > 0 || showCountAlways) && (
        <span className={cn('tabular-nums', count === 0 && showCountAlways && 'invisible')}>{count}</span>
      )}
    </button>
  )
}
