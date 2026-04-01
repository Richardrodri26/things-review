// src/app/(app)/reviews/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ReviewDetailPage } from '@/features/reviews/components'

interface ReviewDetailRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('reviewsTitle'),
    description: t('reviewsDescription'),
    robots: { index: false, follow: false },
  }
}

export default async function ReviewDetailRoute({ params, searchParams }: ReviewDetailRouteProps) {
  const { id } = await params
  const { from } = await searchParams
  return <ReviewDetailPage reviewId={id} backHref={from} />
}
