// src/features/profile/hooks/useUserStats.ts
import { useMemo } from 'react'
import { useStore } from '@/shared/lib/store'
import { computeUserStats } from '../lib/computeUserStats'

export function useUserStats() {
  const reviews = useStore((s) => s.reviews)
  return useMemo(() => computeUserStats(reviews), [reviews])
}
