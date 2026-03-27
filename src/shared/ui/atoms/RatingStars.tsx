// src/shared/ui/atoms/RatingStars.tsx
'use client'

import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rating } from '@/shared/types'

interface RatingStarsProps {
  value?: Rating
  onChange?: (rating: Rating) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-3', md: 'size-4', lg: 'size-5' }

export function RatingStars({ value, onChange, readonly = false, size = 'md' }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5] as Rating[]).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          aria-label={`Rate ${star} out of 5`}
        >
          <StarIcon
            className={cn(
              sizes[size],
              value && star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  )
}
