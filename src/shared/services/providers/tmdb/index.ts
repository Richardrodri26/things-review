import type { ContentType, Genre } from '@/shared/types'
import type { ContentProvider, ProviderItemDetail, ProviderSearchResult, StreamingProvider } from '../types'
import type {
  TMDBGenre,
  TMDBMovieDetail,
  TMDBSearchMovie,
  TMDBSearchResponse,
  TMDBSearchSeries,
  TMDBSeriesDetail,
  TMDBWatchProviderEntry,
  TMDBWatchProvidersByType,
  TMDBWatchProvidersResponse,
} from './types'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const DEFAULT_WATCH_REGION = 'US'

function buildImageUrl(path: string | null, size: 'w300' | 'w500' | 'original' = 'w500'): string | undefined {
  if (!path) return undefined
  return `${IMAGE_BASE_URL}/${size}${path}`
}

function mapTMDBGenre(g: TMDBGenre): Genre {
  return { id: String(g.id), name: g.name, applicableTo: ['movie', 'series'] }
}

function flattenWatchProviders(byType: TMDBWatchProvidersByType): StreamingProvider[] {
  const providers: StreamingProvider[] = []
  const seen = new Set<string>()

  const addEntries = (entries: TMDBWatchProviderEntry[] | undefined, type: StreamingProvider['type']) => {
    for (const entry of entries ?? []) {
      if (seen.has(entry.provider_name)) continue
      seen.add(entry.provider_name)
      providers.push({ name: entry.provider_name, logoUrl: buildImageUrl(entry.logo_path, 'w300'), type })
    }
  }

  addEntries(byType.flatrate, 'flatrate')
  addEntries(byType.free, 'free')
  addEntries(byType.rent, 'rent')
  addEntries(byType.buy, 'buy')

  return providers
}

export class TMDBProvider implements ContentProvider {
  readonly id = 'tmdb'
  readonly displayName = 'The Movie Database'
  readonly logoUrl = 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg'
  readonly supportedContentTypes: ContentType[] = ['movie', 'series']

  private readonly token: string
  private readonly watchRegion: string

  constructor(readAccessToken?: string, watchRegion?: string) {
    this.token = readAccessToken ?? process.env.TMDB_READ_ACCESS_TOKEN ?? ''
    this.watchRegion = watchRegion ?? process.env.TMDB_WATCH_REGION ?? DEFAULT_WATCH_REGION
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    }
  }

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    if (!this.token) return []

    const endpoint = contentType === 'movie' ? 'search/movie' : 'search/tv'
    const url = `${BASE_URL}/${endpoint}?query=${encodeURIComponent(query)}&include_adult=false`

    const res = await fetch(url, { headers: this.headers, next: { revalidate: 0 } })
    if (!res.ok) return []

    if (contentType === 'movie') {
      const data = (await res.json()) as TMDBSearchResponse<TMDBSearchMovie>
      return data.results.slice(0, 10).map((item) => ({
        externalId: String(item.id),
        providerId: this.id,
        contentType: 'movie',
        title: item.title,
        year: item.release_date ? new Date(item.release_date).getFullYear() : undefined,
        coverImageUrl: buildImageUrl(item.poster_path),
        overview: item.overview || undefined,
      }))
    }

    const data = (await res.json()) as TMDBSearchResponse<TMDBSearchSeries>
    return data.results.slice(0, 10).map((item) => ({
      externalId: String(item.id),
      providerId: this.id,
      contentType: 'series',
      title: item.name,
      year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
      coverImageUrl: buildImageUrl(item.poster_path),
      overview: item.overview || undefined,
    }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    if (!this.token) return null

    const endpoint = contentType === 'movie' ? `movie/${externalId}` : `tv/${externalId}`
    const opts = { headers: this.headers, next: { revalidate: 0 } }

    const [detailRes, watchRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/${endpoint}`, opts),
      fetch(`${BASE_URL}/${endpoint}/watch/providers`, opts),
    ])

    if (detailRes.status === 'rejected' || !detailRes.value.ok) return null

    const streamingAvailability = await this.resolveWatchProviders(watchRes)

    if (contentType === 'movie') {
      const data = (await detailRes.value.json()) as TMDBMovieDetail
      return {
        externalId: String(data.id),
        providerId: this.id,
        contentType: 'movie',
        title: data.title,
        year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
        coverImageUrl: buildImageUrl(data.poster_path),
        overview: data.overview || undefined,
        genres: data.genres.map(mapTMDBGenre),
        streamingAvailability,
        extra: data as unknown as Record<string, unknown>,
      }
    }

    const data = (await detailRes.value.json()) as TMDBSeriesDetail
    return {
      externalId: String(data.id),
      providerId: this.id,
      contentType: 'series',
      title: data.name,
      year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0,
      coverImageUrl: buildImageUrl(data.poster_path),
      overview: data.overview || undefined,
      genres: data.genres.map(mapTMDBGenre),
      streamingAvailability,
      extra: data as unknown as Record<string, unknown>,
    }
  }

  private async resolveWatchProviders(outcome: PromiseSettledResult<Response>): Promise<StreamingProvider[]> {
    if (outcome.status === 'rejected' || !outcome.value.ok) return []
    try {
      const data = (await outcome.value.json()) as TMDBWatchProvidersResponse
      const regionData = data.results?.[this.watchRegion]
      if (!regionData) return []
      return flattenWatchProviders(regionData)
    } catch {
      return []
    }
  }
}
