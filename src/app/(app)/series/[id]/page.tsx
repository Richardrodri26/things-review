// src/app/(app)/series/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SeriesDetailPage } from '@/features/catalog/components'

interface SeriesDetailRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SeriesDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('seo')

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?language=en-US`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) throw new Error('Not found')
    const series = await res.json()
    const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : ''
    const posterUrl = series.poster_path
      ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
      : '/opengraph-image.png'

    const title = t('seriesDetailTitle', { title: series.name, year })
    const description = t('seriesDetailDescription', { title: series.name, year })

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: [{ url: posterUrl, width: 500, height: 750, alt: series.name }],
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
