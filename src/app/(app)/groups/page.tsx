// src/app/(app)/groups/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { GroupsPage } from '@/features/groups/components'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('groupsTitle'),
    description: t('groupsDescription'),
    robots: { index: false, follow: false },
  }
}

export default function GroupsRoute() {
  return <GroupsPage />
}
