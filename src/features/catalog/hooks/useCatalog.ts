// src/features/catalog/hooks/useCatalog.ts
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'
import { services } from '@/shared/services'

export const MOVIES_QUERY_KEY = ['catalog', 'movies'] as const
export const SERIES_QUERY_KEY = ['catalog', 'series'] as const

export function useMovies() {
  return useQuery({
    queryKey: MOVIES_QUERY_KEY,
    queryFn: () => services.catalog.getMovies(),
  })
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: [...MOVIES_QUERY_KEY, id] as const,
    queryFn: () => services.catalog.getMovieById(id),
    enabled: !!id,
  })
}

export function useSeriesList() {
  return useQuery({
    queryKey: SERIES_QUERY_KEY,
    queryFn: () => services.catalog.getSeries(),
  })
}

export function useSeriesItem(id: string) {
  return useQuery({
    queryKey: [...SERIES_QUERY_KEY, id] as const,
    queryFn: () => services.catalog.getSeriesById(id),
    enabled: !!id,
  })
}

export function useCatalogItemTitle(contentId: string): string | undefined {
  const queryClient = useQueryClient()

  const movies = queryClient.getQueryData<Movie[]>(MOVIES_QUERY_KEY) ?? []
  const seriesList = queryClient.getQueryData<Series[]>(SERIES_QUERY_KEY) ?? []

  const movie = movies.find((m) => m.id === contentId)
  if (movie) return movie.title

  const series = seriesList.find((s) => s.id === contentId)
  if (series) return series.title

  return undefined
}
