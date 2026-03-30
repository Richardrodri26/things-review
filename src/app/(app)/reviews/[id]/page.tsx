// src/app/(app)/reviews/[id]/page.tsx
import { ReviewDetailPage } from '@/features/reviews/components'

interface ReviewDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function ReviewDetailRoute({ params }: ReviewDetailRouteProps) {
  const { id } = await params
  return <ReviewDetailPage reviewId={id} />
}
