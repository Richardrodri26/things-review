// src/app/(app)/reviews/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ReviewDetailPage } from '@/features/reviews/components'

interface ReviewDetailRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export async function generateMetadata({ params }: ReviewDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('seo')

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        catalogItem: { select: { title: true } },
        user: { select: { name: true } },
      },
    })

    if (!review) throw new Error('Not found')

    const contentTitle = review.catalogItem?.title ?? ''
    const author = review.user?.name ?? ''

    const title = t('reviewDetailTitle', { title: contentTitle, author })
    const description = t('reviewDetailDescription', { title: contentTitle, author })

    return {
      title,
      description,
      robots: { index: false, follow: false },
    }
  } catch {
    return {
      title: t('reviewsTitle'),
      description: t('reviewsDescription'),
      robots: { index: false, follow: false },
    }
  }
}

export default async function ReviewDetailRoute({ params, searchParams }: ReviewDetailRouteProps) {
  const { id } = await params
  const { from } = await searchParams
  return <ReviewDetailPage reviewId={id} backHref={from} />
}
