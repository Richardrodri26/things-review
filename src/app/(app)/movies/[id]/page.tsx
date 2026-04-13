// src/app/(app)/movies/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { MovieDetailPage } from '@/features/catalog/components'

interface MovieDetailRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MovieDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('seo')

  try {
    const item = await prisma.catalogItem.findUnique({
      where: { id },
      select: { title: true, coverImageUrl: true, year: true },
    })

    if (!item) throw new Error('Not found')

    const posterUrl = item.coverImageUrl ?? '/opengraph-image.png'
    const title = t('movieDetailTitle', { title: item.title, year: item.year ?? '' })
    const description = t('movieDetailDescription', { title: item.title, year: item.year ?? '' })

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: [{ url: posterUrl, width: 500, height: 750, alt: item.title }],
        type: 'video.movie',
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
      title: t('moviesTitle'),
      description: t('moviesDescription'),
      robots: { index: false, follow: false },
    }
  }
}

export default async function MovieDetailRoute({ params }: MovieDetailRouteProps) {
  const { id } = await params
  return <MovieDetailPage movieId={id} />
}
