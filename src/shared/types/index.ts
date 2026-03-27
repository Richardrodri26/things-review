// shared/types/index.ts

// ContentType discriminador central
export const CONTENT_TYPE = {
  MOVIE: 'movie',
  SERIES: 'series',
  MUSIC: 'music',
  GAME: 'game',
  BOOK: 'book',
  PODCAST: 'podcast',
} as const

export type ContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE]

export const CONTENT_TYPE_LABELS: Record<ContentType, { en: string; es: string; icon: string }> = {
  movie:   { en: 'Movie',   es: 'Película',   icon: '🎬' },
  series:  { en: 'Series',  es: 'Serie',      icon: '📺' },
  music:   { en: 'Music',   es: 'Música',     icon: '🎵' },
  game:    { en: 'Game',    es: 'Videojuego', icon: '🎮' },
  book:    { en: 'Book',    es: 'Libro',      icon: '📚' },
  podcast: { en: 'Podcast', es: 'Podcast',    icon: '🎙️' },
}

// Rating 1-5
export type Rating = 1 | 2 | 3 | 4 | 5

// ConsumptionStatus — genérico, la UI muestra el label según contentType
export const CONSUMPTION_STATUS = {
  CONSUMED: 'consumed',
  WANT_TO_CONSUME: 'want_to_consume',
  CONSUMING: 'consuming',
  DROPPED: 'dropped',
} as const

export type ConsumptionStatus = (typeof CONSUMPTION_STATUS)[keyof typeof CONSUMPTION_STATUS]

export const CONSUMPTION_STATUS_LABELS: Record<
  ConsumptionStatus,
  Record<ContentType, { en: string; es: string }>
> = {
  consumed: {
    movie:   { en: 'Watched',        es: 'Vista' },
    series:  { en: 'Watched',        es: 'Vista' },
    music:   { en: 'Listened',       es: 'Escuchado' },
    game:    { en: 'Played',         es: 'Jugado' },
    book:    { en: 'Read',           es: 'Leído' },
    podcast: { en: 'Listened',       es: 'Escuchado' },
  },
  want_to_consume: {
    movie:   { en: 'Want to Watch',  es: 'Quiero verla' },
    series:  { en: 'Want to Watch',  es: 'Quiero verla' },
    music:   { en: 'Want to Listen', es: 'Quiero escucharlo' },
    game:    { en: 'Want to Play',   es: 'Quiero jugarlo' },
    book:    { en: 'Want to Read',   es: 'Quiero leerlo' },
    podcast: { en: 'Want to Listen', es: 'Quiero escucharlo' },
  },
  consuming: {
    movie:   { en: 'Watching',   es: 'Viendo' },
    series:  { en: 'Watching',   es: 'Viendo' },
    music:   { en: 'Listening',  es: 'Escuchando' },
    game:    { en: 'Playing',    es: 'Jugando' },
    book:    { en: 'Reading',    es: 'Leyendo' },
    podcast: { en: 'Listening',  es: 'Escuchando' },
  },
  dropped: {
    movie:   { en: 'Dropped', es: 'Abandonada' },
    series:  { en: 'Dropped', es: 'Abandonada' },
    music:   { en: 'Dropped', es: 'Abandonado' },
    game:    { en: 'Dropped', es: 'Abandonado' },
    book:    { en: 'Dropped', es: 'Abandonado' },
    podcast: { en: 'Dropped', es: 'Abandonado' },
  },
}

// ReviewableItem — interfaz base de todo contenido
export interface Genre {
  id: string
  name: string
  nameEs?: string
  applicableTo: ContentType[]
}

export interface ReviewableItem {
  id: string
  contentType: ContentType
  providerId: string
  externalId?: string
  title: string
  coverImageUrl?: string
  year: number
  genres: Genre[]
  overview?: string
  createdAt: Date
}

// GroupVisibility
export const GROUP_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const

export type GroupVisibility = (typeof GROUP_VISIBILITY)[keyof typeof GROUP_VISIBILITY]

// GroupRole
export const GROUP_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type GroupRole = (typeof GROUP_ROLE)[keyof typeof GROUP_ROLE]
