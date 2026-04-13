// src/app/(app)/series/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { SeriesDetailPage } from '@/features/catalog/components'

interface SeriesDetailRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SeriesDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('seo')

  try {
    const item = await prisma.catalogItem.findUnique({
      where: { id },
      select: { title: true, coverImageUrl: true, year: true },
    })

    if (!item) throw new Error('Not found')

    const posterUrl = item.coverImageUrl ?? '/opengraph-image.png'
    const title = t('seriesDetailTitle', { title: item.title, year: item.year ?? '' })
    const description = t('seriesDetailDescription', { title: item.title, year: item.year ?? '' })

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: [{ url: posterUrl, width: 500, height: 750, alt: item.title }],
        type: 'video.tv_show',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [posterUrl],
      },
    }
  } catch {
    return {
      title: t('seriesTitle'),
      description: t('seriesDescription'),
      robots: { index: false, follow: false },
    }
  }
}

export default async function SeriesDetailRoute({ params }: SeriesDetailRouteProps) {
  const { id } = await params
  return <SeriesDetailPage seriesId={id} />
}
