// src/app/(app)/series/[id]/page.tsx
import { SeriesDetailPage } from '@/features/catalog/components'

interface SeriesDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function SeriesDetailRoute({ params }: SeriesDetailRouteProps) {
  const { id } = await params
  return <SeriesDetailPage seriesId={id} />
}
