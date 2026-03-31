// src/shared/ui/atoms/RatingStars.tsx
'use client'

import { useId, useState } from 'react'
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

function formatRating(value: number | null | undefined): string {
  if (value == null) return '—'
  // Show up to 2 decimal places but drop trailing zeros (e.g. 3.5 not 3.50, but 3.25 as 3.25)
  const decimals = value % 1 !== 0 && (value * 4) % 2 !== 0 ? 2 : 1
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

interface StarProps {
  star: number
  displayValue: number | undefined
  size: number
  readonly: boolean
  /** Unique prefix per RatingStars instance to avoid SVG clipPath id collisions */
  uid: string
  onMouseMove?: (star: number, e: React.MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: () => void
  onClick?: (star: number, e: React.MouseEvent<HTMLButtonElement>) => void
}

function Star({ star, displayValue, size, readonly, uid, onMouseMove, onMouseLeave, onClick }: StarProps) {
  const fillPercent = getFillPercent(star, displayValue)
  const clipId = `${uid}-${star}`

  return (
    <button
      type="button"
      disabled={readonly}
      onMouseMove={readonly ? undefined : (e) => onMouseMove?.(star, e)}
      onMouseLeave={readonly ? undefined : onMouseLeave}
      onClick={readonly ? undefined : (e) => onClick?.(star, e)}
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

/** Given a mouse event on a star button, resolve the rating value in quarter-star increments.
 *  The star is divided into 4 equal zones: 0.25 / 0.50 / 0.75 / 1.00
 */
function resolveRating(star: number, e: React.MouseEvent<HTMLButtonElement>): Rating {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width   // 0.0 → 1.0 across the star
  const quarter = Math.ceil(ratio * 4) / 4              // snap to nearest 0.25
  return parseFloat((star - 1 + Math.max(quarter, 0.25)).toFixed(2)) as Rating
}

const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export function RatingStars({ value, onChange, readonly = false, size = 'md', showValue = false }: RatingStarsProps) {
  const px = sizes[size]
  const uid = useId().replace(/:/g, '')   // unique per instance — safe for SVG ids
  // hoverValue is the "preview" rating while hovering — null means show real value
  const [hoverValue, setHoverValue] = useState<Rating | null>(null)

  const displayValue = hoverValue ?? value

  function handleMouseMove(star: number, e: React.MouseEvent<HTMLButtonElement>) {
    setHoverValue(resolveRating(star, e))
  }

  function handleMouseLeave() {
    setHoverValue(null)
  }

  function handleClick(star: number, e: React.MouseEvent<HTMLButtonElement>) {
    const rating = resolveRating(star, e)
    onChange?.(rating)
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={readonly ? undefined : handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          star={star}
          displayValue={displayValue}
          size={px}
          readonly={readonly}
          uid={uid}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      ))}
      {showValue && displayValue != null && (
        <span className={cn('ml-1 tabular-nums text-muted-foreground', textSizes[size])}>
          ({formatRating(displayValue)})
        </span>
      )}
    </div>
  )
}
