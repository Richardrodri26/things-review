// src/shared/ui/atoms/RatingStars.tsx
'use client'

import { cn } from '@/lib/utils'
import type { Rating } from '@/shared/types'

interface RatingStarsProps {
  value?: Rating
  onChange?: (rating: Rating) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Show the numeric value next to the stars (1 decimal, locale-aware) */
  showValue?: boolean
}

const sizes = { sm: 16, md: 20, lg: 24 }

/** Returns the fill percentage [0-100] for star position `star` given a `value`. */
function getFillPercent(star: number, value: number | undefined): number {
  if (value === undefined) return 0
  if (value >= star) return 100
  if (value < star - 1) return 0
  return Math.round((value - (star - 1)) * 100)
}

function formatRating(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

interface StarProps {
  star: number
  value: number | undefined
  size: number
  readonly: boolean
  onClick?: (star: number) => void
}

function Star({ star, value, size, readonly, onClick }: StarProps) {
  const fillPercent = getFillPercent(star, value)
  const clipId = `star-clip-${star}-${size}`

  return (
    <button
      type="button"
      disabled={readonly}
      onClick={() => onClick?.(star)}
      className={cn(
        'transition-transform',
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
      )}
      aria-label={`Rate ${star} out of 5`}
      style={{ width: size, height: size, padding: 0, background: 'none', border: 'none' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={`${fillPercent}%`} height="24" />
          </clipPath>
        </defs>
        {/* Empty star (outline) */}
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        />
        {/* Filled star (clipped to fillPercent) */}
        {fillPercent > 0 && (
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-yellow-400"
            clipPath={`url(#${clipId})`}
          />
        )}
      </svg>
    </button>
  )
}

const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export function RatingStars({ value, onChange, readonly = false, size = 'md', showValue = false }: RatingStarsProps) {
  const px = sizes[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          star={star}
          value={value}
          size={px}
          readonly={readonly}
          onClick={readonly ? undefined : (s) => onChange?.(s as Rating)}
        />
      ))}
      {showValue && value !== undefined && (
        <span className={cn('ml-1 tabular-nums text-muted-foreground', textSizes[size])}>
          ({formatRating(value)})
        </span>
      )}
    </div>
  )
}
