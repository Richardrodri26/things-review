// src/app/(app)/series/page.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { SeriesPage } from '@/features/catalog/components'

export default function SeriesRoute() {
  return (
    <NuqsAdapter>
      <SeriesPage />
    </NuqsAdapter>
  )
}
