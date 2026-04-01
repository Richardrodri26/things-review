// src/features/profile/hooks/useUserStats.ts
import { useMemo } from 'react'
import { useReviews } from '@/features/reviews/hooks'
import { computeUserStats } from '../lib/computeUserStats'

export function useUserStats() {
  const { data: reviews = [] } = useReviews()
  return useMemo(() => computeUserStats(reviews), [reviews])
}
