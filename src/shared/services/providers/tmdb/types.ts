// Internal TMDB API response types — not exported outside this module

export interface TMDBSearchMovie {
  id: number
  title: string
  original_title: string
  release_date: string
  poster_path: string | null
  overview: string
  genre_ids: number[]
  adult: boolean
  original_language: string
}

export interface TMDBSearchSeries {
  id: number
  name: string
  original_name: string
  first_air_date: string
  poster_path: string | null
  overview: string
  genre_ids: number[]
  original_language: string
}

export interface TMDBSearchResponse<T> {
  results: T[]
  total_results: number
  total_pages: number
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBMovieDetail {
  id: number
  title: string
  original_title: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  genres: TMDBGenre[]
  runtime: number | null
  original_language: string
  adult: boolean
}

export interface TMDBSeriesDetail {
  id: number
  name: string
  original_name: string
  first_air_date: string
  last_air_date: string | null
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  genres: TMDBGenre[]
  number_of_seasons: number
  number_of_episodes: number
  status: string
  original_language: string
  adult: boolean
}

export interface TMDBWatchProviderEntry {
  provider_id: number
  provider_name: string
  logo_path: string
}

export interface TMDBWatchProvidersByType {
  flatrate?: TMDBWatchProviderEntry[]
  rent?: TMDBWatchProviderEntry[]
  buy?: TMDBWatchProviderEntry[]
  free?: TMDBWatchProviderEntry[]
}

export interface TMDBWatchProvidersResponse {
  results: Record<string, TMDBWatchProvidersByType>
}
