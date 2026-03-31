// shared/constants/index.ts

// Routes de la app
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MOVIES: '/movies',
  MOVIE_DETAIL: (id: string) => `/movies/${id}`,
  SERIES: '/series',
  SERIES_DETAIL: (id: string) => `/series/${id}`,
  REVIEWS: '/reviews',
  REVIEWS_FILTERED: (types: string[]) => `/reviews?types=${types.join(',')}`,
  REVIEW_DETAIL: (id: string) => `/reviews/${id}`,
  WATCHLIST: '/watchlist',
  GROUPS: '/groups',
  GROUP_DETAIL: (id: string) => `/groups/${id}`,
  PROFILE: '/profile',
} as const

// Claves de localStorage
export const STORAGE_KEYS = {
  USER: 'things-review:user',
  REVIEWS: 'things-review:reviews',
  COMMENTS: 'things-review:comments',
  GROUPS: 'things-review:groups',
  MEMBERSHIPS: 'things-review:memberships',
  CACHE_MOVIES: 'things-review:cache:movies',
  CACHE_SERIES: 'things-review:cache:series',
  CACHE_MUSIC: 'things-review:cache:music',
  CACHE_GAMES: 'things-review:cache:games',
  CACHE_BOOKS: 'things-review:cache:books',
  CACHE_PODCASTS: 'things-review:cache:podcasts',
  SETTINGS: 'things-review:settings',
} as const

// Configuración de TanStack Query
export const QUERY_CONFIG = {
  STALE_TIME: 1000 * 60 * 5,      // 5 minutos
  GC_TIME: 1000 * 60 * 60,        // 1 hora
  RETRY: 1,
} as const
