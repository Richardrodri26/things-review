// src/app/(app)/reviews/[id]/page.tsx
import { ReviewDetailPage } from '@/features/reviews/components'

interface ReviewDetailRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function ReviewDetailRoute({ params, searchParams }: ReviewDetailRouteProps) {
  const { id } = await params
  const { from } = await searchParams
  return <ReviewDetailPage reviewId={id} backHref={from} />
}
