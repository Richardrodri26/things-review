import { PublicProfilePage } from '@/features/profile/components/PublicProfilePage'

export default async function PublicProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PublicProfilePage userId={id} />
}
