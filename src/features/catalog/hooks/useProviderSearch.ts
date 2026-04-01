'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncer } from '@tanstack/react-pacer'
import { apiPost } from '@/shared/services/api/api-client'
import type { ContentType } from '@/shared/types'
import type { ProviderSearchResult, ProvidersSearchResponse } from '@/shared/services/providers/types'
import { CONTENT_TYPE_QUERY_KEY } from './useCatalog'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2

// ─── Search hook ──────────────────────────────────────────────────────────────

export function useProviderSearch(query: string, contentType: ContentType, enabled: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const debouncer = useDebouncer(
    (q: string) => setDebouncedQuery(q),
    { wait: DEBOUNCE_MS },
    (state) => ({ isPending: state.isPending })
  )

  // Fire debouncer on every query change (caller passes the raw input value)
  // This replaces the old useEffect + setTimeout pattern
  if (enabled) {
    debouncer.maybeExecute(query)
  }

  const shouldFetch = enabled && debouncedQuery.trim().length >= MIN_QUERY_LENGTH

  return {
    ...useQuery<ProvidersSearchResponse>({
      queryKey: ['providers', 'search', contentType, debouncedQuery],
      queryFn: async () => {
        const url = new URL('/api/providers/search', window.location.origin)
        url.searchParams.set('q', debouncedQuery)
        url.searchParams.set('type', contentType)
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error('Search failed')
        return res.json()
      },
      enabled: shouldFetch,
      staleTime: 30_000,
      gcTime: 60_000,
      placeholderData: (prev) => prev,
    }),
    isDebouncing: debouncer.state.isPending,
  }
}

// ─── Add-from-provider mutation ───────────────────────────────────────────────

interface AddProviderItemBody {
  contentType: string
  title: string
  year?: number
  coverImageUrl?: string
  externalId: string
  provider: string
  metadata?: Record<string, unknown>
}

interface AddProviderItemResponse {
  id: string
  contentType: string
  title: string
  coverImageUrl: string | null
  year: number | null
}

export function useAddFromProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (result: ProviderSearchResult) => {
      const body: AddProviderItemBody = {
        contentType: result.contentType,
        title: result.title,
        year: result.year,
        coverImageUrl: result.coverImageUrl,
        externalId: result.externalId,
        provider: result.providerId,
        metadata: {
          overview: result.overview,
          streamingAvailability: result.streamingAvailability,
        },
      }
      return apiPost<AddProviderItemResponse>('/catalog/items', body)
    },
    onSuccess: (item) => {
      const key = CONTENT_TYPE_QUERY_KEY[item.contentType]
      if (key) queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
