// src/app/(app)/groups/[id]/page.tsx
import { GroupDetailPage } from '@/features/groups/components'

interface GroupDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailRoute({ params }: GroupDetailRouteProps) {
  const { id } = await params
  return <GroupDetailPage groupId={id} />
}
