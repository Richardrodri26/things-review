'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'

interface CoverImageProps {
  src: string | null | undefined
  alt: string
  contentType: ContentType
  fill?: boolean
  sizes?: string
  className?: string
  /** Extra classes applied to the placeholder wrapper (same container as the image) */
  placeholderClassName?: string
  priority?: boolean
  /** Emoji size class, defaults to text-4xl */
  iconSize?: string
  showTitle?: boolean
  title?: string
}

/**
 * Drop-in replacement for next/image poster covers.
 * Falls back to the content-type emoji placeholder on load error
 * (blocked domain, 404, network failure, etc.).
 */
export function CoverImage({
  src,
  alt,
  contentType,
  fill = true,
  sizes,
  className,
  placeholderClassName,
  priority,
  iconSize = 'text-4xl',
  showTitle = true,
  title,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const { icon } = CONTENT_TYPE_LABELS[contentType]

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted via-muted to-muted-foreground/15 select-none',
          placeholderClassName,
        )}
      >
        <span
          className={cn(iconSize, 'drop-shadow-sm')}
          aria-hidden
          style={{ filter: 'saturate(0.7) brightness(0.85)' }}
        >
          {icon}
        </span>
        {showTitle && (title ?? alt) && (
          <p className="px-3 text-center text-[10px] font-medium text-muted-foreground leading-tight line-clamp-3 max-w-[85%]">
            {title ?? alt}
          </p>
        )}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
      unoptimized
    />
  )
}
