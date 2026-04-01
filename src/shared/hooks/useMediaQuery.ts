'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar media queries.
 * Uso: useMediaQuery('(min-width: 768px)') o useMediaQuery('min-md')
 * Shorthand: 'min-md' → '(min-width: 768px)', 'max-md' → '(max-width: 767px)'
 */
const SHORTHANDS: Record<string, string> = {
  'min-sm':  '(min-width: 640px)',
  'max-sm':  '(max-width: 639px)',
  'min-md':  '(min-width: 768px)',
  'max-md':  '(max-width: 767px)',
  'min-lg':  '(min-width: 1024px)',
  'max-lg':  '(max-width: 1023px)',
  'min-xl':  '(min-width: 1280px)',
  'max-xl':  '(max-width: 1279px)',
}

export function useMediaQuery(query: string): boolean {
  const resolvedQuery = SHORTHANDS[query] ?? query

  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(resolvedQuery)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [resolvedQuery])

  return matches
}
