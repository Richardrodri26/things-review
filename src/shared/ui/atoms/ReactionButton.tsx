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

export function ReactionButton({ type, count, isActive, onClick, disabled }: ReactionButtonProps) {
  const { Icon, activeClass, hoverClass, label } = config[type]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={isActive}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        'transition-all duration-150',
        'text-muted-foreground border-border bg-transparent',
        !disabled && hoverClass,
        isActive && activeClass,
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  )
}
