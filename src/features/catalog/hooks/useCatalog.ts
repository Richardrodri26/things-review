// src/features/catalog/hooks/useCatalog.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'
import type { AddItemDTO, CatalogItem } from '@/shared/services'
import { services } from '@/shared/services'
import type { ContentType } from '@/shared/types'

export const MOVIES_QUERY_KEY   = ['catalog', 'movies']   as const
export const SERIES_QUERY_KEY   = ['catalog', 'series']   as const
export const MUSIC_QUERY_KEY    = ['catalog', 'music']    as const
export const GAMES_QUERY_KEY    = ['catalog', 'games']    as const
export const BOOKS_QUERY_KEY    = ['catalog', 'books']    as const
export const PODCASTS_QUERY_KEY = ['catalog', 'podcasts'] as const

const CONTENT_TYPE_QUERY_KEY: Record<string, readonly string[]> = {
  movie:   MOVIES_QUERY_KEY,
  series:  SERIES_QUERY_KEY,
  music:   MUSIC_QUERY_KEY,
  game:    GAMES_QUERY_KEY,
  book:    BOOKS_QUERY_KEY,
  podcast: PODCASTS_QUERY_KEY,
}

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

/** Retorna todos los items del catálogo para un tipo dado */
export function useCatalogByType(contentType: ContentType | null) {
  return useQuery({
    queryKey: contentType ? CONTENT_TYPE_QUERY_KEY[contentType] : ['catalog', 'none'],
    queryFn: () => (contentType ? services.catalog.getByType(contentType) : Promise.resolve([])),
    enabled: !!contentType,
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

export function useCatalogItem(contentType: ContentType | null, contentId: string): CatalogItem | undefined {
  const { data } = useCatalogByType(contentType)
  if (!data || !contentId) return undefined
  return data.find((item) => item.id === contentId)
}

export function useAddCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddItemDTO) => services.catalog.addItem(data),
    onSuccess: (item) => {
      const key = CONTENT_TYPE_QUERY_KEY[item.contentType]
      if (key) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}
