import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ReviewList } from '@/features/reviews/components/ReviewList'

export default function ReviewsPage() {
  return (
    <NuqsAdapter>
      <ReviewList />
    </NuqsAdapter>
  )
}
