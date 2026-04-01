// src/app/(app)/groups/[id]/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { GroupDetailPage } from '@/features/groups/components'

interface GroupDetailRouteProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('groupsTitle'),
    description: t('groupsDescription'),
    robots: { index: false, follow: false },
  }
}

export default async function GroupDetailRoute({ params }: GroupDetailRouteProps) {
  const { id } = await params
  return <GroupDetailPage groupId={id} />
}
