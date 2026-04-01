'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BackdropImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

/**
 * Backdrop image that hides itself on load error.
 * Used for wide cinematic banners in detail pages.
 */
export function BackdropImage({ src, alt, className, priority }: BackdropImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      priority={priority}
      sizes="100vw"
      onError={() => setFailed(true)}
    />
  )
}
