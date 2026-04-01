import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ReviewList } from '@/features/reviews/components/ReviewList'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('reviewsTitle'),
    description: t('reviewsDescription'),
    robots: { index: false, follow: false },
  }
}

export default function ReviewsPage() {
  return (
    <NuqsAdapter>
      <ReviewList />
    </NuqsAdapter>
  )
}
