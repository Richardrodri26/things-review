// src/app/(app)/movies/page.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { MoviesPage } from '@/features/catalog/components'

export default function MoviesRoute() {
  return (
    <NuqsAdapter>
      <MoviesPage />
    </NuqsAdapter>
  )
}
