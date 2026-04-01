// shared/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/shared/constants'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CONFIG.STALE_TIME,
        gcTime: QUERY_CONFIG.GC_TIME,
        retry: QUERY_CONFIG.RETRY,
        refetchOnWindowFocus: true,
      },
    },
  })
}

// Singleton para client-side
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre nueva instancia
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
