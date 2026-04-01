// src/app/(app)/profile/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ProfilePage } from '@/features/profile/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('profileTitle'),
    description: t('profileDescription'),
    robots: { index: false, follow: false },
  }
}

export default function ProfileRoute() {
  return <ProfilePage />
}
