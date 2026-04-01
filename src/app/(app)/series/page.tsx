// src/app/(app)/series/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { SeriesPage } from '@/features/catalog/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('seriesTitle'),
    description: t('seriesDescription'),
    robots: { index: false, follow: false },
  }
}

export default function SeriesRoute() {
  return (
    <NuqsAdapter>
      <SeriesPage />
    </NuqsAdapter>
  )
}
