import type { ContentType, Genre } from '@/shared/types'

// ─── Streaming availability (TMDB Watch Providers / JustWatch data) ───────────

export interface StreamingProvider {
  name: string
  logoUrl?: string
  type: 'flatrate' | 'rent' | 'buy' | 'free'
}

// ─── Search result (ephemeral — never persisted directly) ─────────────────────

export interface ProviderSearchResult {
  externalId: string
  providerId: string
  contentType: ContentType
  title: string
  year?: number
  coverImageUrl?: string
  overview?: string
  // Only populated for movie/series (TMDB Watch Providers)
  streamingAvailability?: StreamingProvider[]
}

// ─── Full detail (used to pre-populate the review form) ──────────────────────

export interface ProviderItemDetail extends ProviderSearchResult {
  genres: Genre[]
  extra: Record<string, unknown> // Raw provider response for downstream mapping
}

// ─── Provider contract ────────────────────────────────────────────────────────

export interface ContentProvider {
  readonly id: string
  readonly displayName: string
  readonly logoUrl?: string
  readonly supportedContentTypes: ContentType[]
  /** Override the default 5s timeout for slow APIs (ms) */
  readonly timeout?: number

  search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]>
  getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null>
}

// ─── Search response (API route shape) ───────────────────────────────────────

export interface ProvidersSearchResponse {
  results: ProviderSearchResult[]
  // Which providers responded (for debugging / UI attribution)
  sources: string[]
  // Which providers failed (so the UI can show a subtle warning)
  errors: Array<{ providerId: string; message: string }>
}
