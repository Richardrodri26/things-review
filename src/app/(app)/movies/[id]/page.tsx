// src/app/(app)/movies/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { MovieDetailPage } from '@/features/catalog/components'

interface MovieDetailRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MovieDetailRouteProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('seo')

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?language=en-US`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) throw new Error('Not found')
    const movie = await res.json()
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : ''
    const posterUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : '/opengraph-image.png'

    const title = t('movieDetailTitle', { title: movie.title, year })
    const description = t('movieDetailDescription', { title: movie.title, year })

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        images: [{ url: posterUrl, width: 500, height: 750, alt: movie.title }],
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
