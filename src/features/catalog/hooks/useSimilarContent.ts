import { useQuery } from '@tanstack/react-query'
import type { ProviderSearchResult } from '@/shared/services/providers/types'
import type { ContentType } from '@/shared/types'

async function fetchSimilarContent(
  externalId: string,
  contentType: ContentType
): Promise<ProviderSearchResult[]> {
  const params = new URLSearchParams({ externalId, contentType })
  const res = await fetch(`/api/providers/similar?${params}`)
  if (!res.ok) return []
  return res.json()
}

export function useSimilarContent(externalId: string | undefined, contentType: ContentType) {
  return useQuery({
    queryKey: ['similar', contentType, externalId],
    queryFn: () => fetchSimilarContent(externalId!, contentType),
    enabled: !!externalId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
