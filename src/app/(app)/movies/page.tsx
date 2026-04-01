// src/app/(app)/movies/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { MoviesPage } from '@/features/catalog/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('moviesTitle'),
    description: t('moviesDescription'),
    robots: { index: false, follow: false },
  }
}

export default function MoviesRoute() {
  return (
    <NuqsAdapter>
      <MoviesPage />
    </NuqsAdapter>
  )
}
