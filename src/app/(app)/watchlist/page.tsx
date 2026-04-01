import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { WatchlistPage } from '@/features/watchlist/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('watchlistTitle'),
    description: t('watchlistDescription'),
    robots: { index: false, follow: false },
  }
}

export default function WatchlistRoute() {
  return <WatchlistPage />
}
