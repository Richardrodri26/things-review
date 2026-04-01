// src/app/(app)/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DashboardPage } from '@/features/dashboard/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('dashboardTitle'),
    description: t('dashboardDescription'),
    robots: { index: false, follow: false },
  }
}

export default function HomeRoute() {
  return <DashboardPage />
}
