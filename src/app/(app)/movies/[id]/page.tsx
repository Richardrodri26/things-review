// src/app/(app)/movies/[id]/page.tsx
import { MovieDetailPage } from '@/features/catalog/components'

interface MovieDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function MovieDetailRoute({ params }: MovieDetailRouteProps) {
  const { id } = await params
  return <MovieDetailPage movieId={id} />
}
