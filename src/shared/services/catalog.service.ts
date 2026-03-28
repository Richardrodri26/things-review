// src/shared/services/catalog.service.ts
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'
import type { MusicAlbum } from '@/entities/music/types'
import type { Game } from '@/entities/game/types'
import type { Book } from '@/entities/book/types'
import type { Podcast } from '@/entities/podcast/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export type CatalogItem = Movie | Series | MusicAlbum | Game | Book | Podcast

export type AddItemDTO =
  | Omit<Movie,       'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Series,      'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<MusicAlbum,  'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Game,        'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Book,        'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Podcast,     'id' | 'createdAt' | 'providerId' | 'externalId'>

export interface ICatalogService {
  getMovies(): Promise<Movie[]>
  getMovieById(id: string): Promise<Movie | null>
  getSeries(): Promise<Series[]>
  getSeriesById(id: string): Promise<Series | null>
  search(query: string): Promise<CatalogItem[]>
  addItem(data: AddItemDTO): Promise<CatalogItem>
}

const MOCK_MOVIES: Omit<Movie, 'id' | 'createdAt'>[] = [
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Inception',
    originalTitle: 'Inception',
    year: 2010,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['movie'] }, { id: '2', name: 'Action', applicableTo: ['movie'] }],
    overview: 'A thief who steals corporate secrets through dream-sharing technology.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    releaseDate: '2010-07-16',
    runtime: 148,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    year: 2008,
    genres: [{ id: '2', name: 'Action', applicableTo: ['movie'] }, { id: '3', name: 'Crime', applicableTo: ['movie'] }],
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and DA Harvey Dent.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsNprs3Dg.jpg',
    releaseDate: '2008-07-18',
    runtime: 152,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    year: 2014,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['movie'] }, { id: '4', name: 'Drama', applicableTo: ['movie'] }],
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    releaseDate: '2014-11-07',
    runtime: 169,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Pulp Fiction',
    originalTitle: 'Pulp Fiction',
    year: 1994,
    genres: [{ id: '3', name: 'Crime', applicableTo: ['movie'] }, { id: '4', name: 'Drama', applicableTo: ['movie'] }],
    overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    releaseDate: '1994-10-14',
    runtime: 154,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    year: 1999,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['movie'] }, { id: '2', name: 'Action', applicableTo: ['movie'] }],
    overview: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
    releaseDate: '1999-03-31',
    runtime: 136,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Parasite',
    originalTitle: '기생충',
    year: 2019,
    genres: [{ id: '3', name: 'Crime', applicableTo: ['movie'] }, { id: '4', name: 'Drama', applicableTo: ['movie'] }],
    overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    releaseDate: '2019-05-30',
    runtime: 132,
    originalLanguage: 'ko',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Everything Everywhere All at Once',
    originalTitle: 'Everything Everywhere All at Once',
    year: 2022,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['movie'] }, { id: '5', name: 'Comedy', applicableTo: ['movie'] }],
    overview: 'A middle-aged Chinese immigrant is swept up in an insane adventure where she must connect with parallel universe versions of herself.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fFexlkjJxs29MzKJo9mY9RWLLVS.jpg',
    releaseDate: '2022-03-25',
    runtime: 139,
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'movie',
    providerId: 'mock',
    title: 'Dune: Part One',
    originalTitle: 'Dune: Part One',
    year: 2021,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['movie'] }, { id: '6', name: 'Adventure', applicableTo: ['movie'] }],
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny, must travel to the most dangerous planet in the universe.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvwE3HP2SmWeqwwVsW.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
    releaseDate: '2021-09-15',
    runtime: 155,
    originalLanguage: 'en',
    adult: false,
  },
]

const MOCK_SERIES: Omit<Series, 'id' | 'createdAt'>[] = [
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    year: 2008,
    genres: [{ id: '3', name: 'Crime', applicableTo: ['series'] }, { id: '4', name: 'Drama', applicableTo: ['series'] }],
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    firstAirDate: '2008-01-20',
    lastAirDate: '2013-09-29',
    numberOfSeasons: 5,
    numberOfEpisodes: 62,
    status: 'ended',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Succession',
    originalTitle: 'Succession',
    year: 2018,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '5', name: 'Comedy', applicableTo: ['series'] }],
    overview: 'The Roy family is known for controlling the biggest media and entertainment conglomerate in the world.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/e2X8NpiN9sMoqnZKBNhS7bGFSBc.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/1Fh8jLGMiPRlsJVa9GEdnFMURZb.jpg',
    firstAirDate: '2018-06-03',
    lastAirDate: '2023-05-28',
    numberOfSeasons: 4,
    numberOfEpisodes: 39,
    status: 'ended',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'The Bear',
    originalTitle: 'The Bear',
    year: 2022,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '5', name: 'Comedy', applicableTo: ['series'] }],
    overview: 'A young chef from the fine dining world returns to Chicago to run his family\'s sandwich shop.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/jKuDyqx7jlnMXCLBjGSrMYoTWpY.jpg',
    firstAirDate: '2022-06-23',
    numberOfSeasons: 3,
    numberOfEpisodes: 28,
    status: 'returning_series',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Severance',
    originalTitle: 'Severance',
    year: 2022,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '7', name: 'Mystery', applicableTo: ['series'] }],
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/lMZv9zones7RCiKSuoJPLFz3TkR.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/bLoSBHNShFUoAof4JMSNEPxaOhU.jpg',
    firstAirDate: '2022-02-18',
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    status: 'returning_series',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Dark',
    originalTitle: 'Dark',
    year: 2017,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '7', name: 'Mystery', applicableTo: ['series'] }],
    overview: 'A family saga with a supernatural twist set in a German town where the disappearance of two young children exposes the double lives of its residents.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/2hObqSCFbBYCFMGI0PzRFRMkVIP.jpg',
    firstAirDate: '2017-12-01',
    lastAirDate: '2020-06-27',
    numberOfSeasons: 3,
    numberOfEpisodes: 26,
    status: 'ended',
    originalLanguage: 'de',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    year: 2023,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '6', name: 'Adventure', applicableTo: ['series'] }],
    overview: 'Joel and Ellie must survive in a post-apocalyptic world overrun by infected humans and hostile survivors.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd7iPQ9BpJOMB7QKXHLN.jpg',
    firstAirDate: '2023-01-15',
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    status: 'returning_series',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Shogun',
    originalTitle: 'Shōgun',
    year: 2024,
    genres: [{ id: '4', name: 'Drama', applicableTo: ['series'] }, { id: '6', name: 'Adventure', applicableTo: ['series'] }],
    overview: 'A power struggle for control of feudal Japan, seen through the eyes of English navigator John Blackthorne.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg0WnHBpSlXl.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/9GBhzXMFjgcZ3FdR9w3bqMMRKqw.jpg',
    firstAirDate: '2024-02-27',
    lastAirDate: '2024-04-23',
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: 'ended',
    originalLanguage: 'en',
    adult: false,
  },
  {
    contentType: 'series',
    providerId: 'mock',
    title: 'Andor',
    originalTitle: 'Andor',
    year: 2022,
    genres: [{ id: '1', name: 'Science Fiction', applicableTo: ['series'] }, { id: '2', name: 'Action', applicableTo: ['series'] }],
    overview: 'In an era filled with danger, deception and intrigue, Cassian Andor will embark on the path that is destined to turn him into a rebel hero.',
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/59SVNwLfoMnZPPB6ukW6dlPxAdI.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/59SVNwLfoMnZPPB6ukW6dlPxAdI.jpg',
    firstAirDate: '2022-09-21',
    numberOfSeasons: 2,
    numberOfEpisodes: 24,
    status: 'returning_series',
    originalLanguage: 'en',
    adult: false,
  },
]

export class LocalCatalogService implements ICatalogService {
  private readMovies(): Movie[] {
    return getFromStorage<Movie[]>(STORAGE_KEYS.CACHE_MOVIES, [])
  }

  private readSeries(): Series[] {
    return getFromStorage<Series[]>(STORAGE_KEYS.CACHE_SERIES, [])
  }

  private readMusic(): MusicAlbum[] {
    return getFromStorage<MusicAlbum[]>(STORAGE_KEYS.CACHE_MUSIC, [])
  }

  private readGames(): Game[] {
    return getFromStorage<Game[]>(STORAGE_KEYS.CACHE_GAMES, [])
  }

  private readBooks(): Book[] {
    return getFromStorage<Book[]>(STORAGE_KEYS.CACHE_BOOKS, [])
  }

  private readPodcasts(): Podcast[] {
    return getFromStorage<Podcast[]>(STORAGE_KEYS.CACHE_PODCASTS, [])
  }

  private seed(): void {
    const movies = this.readMovies()
    if (movies.length === 0) {
      const seeded: Movie[] = MOCK_MOVIES.map((m) => ({
        ...m,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_MOVIES, seeded)
    }

    const series = this.readSeries()
    if (series.length === 0) {
      const seeded: Series[] = MOCK_SERIES.map((s) => ({
        ...s,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_SERIES, seeded)
    }
  }

  async getMovies(): Promise<Movie[]> {
    this.seed()
    return this.readMovies()
  }

  async getMovieById(id: string): Promise<Movie | null> {
    this.seed()
    return this.readMovies().find((m) => m.id === id) ?? null
  }

  async getSeries(): Promise<Series[]> {
    this.seed()
    return this.readSeries()
  }

  async getSeriesById(id: string): Promise<Series | null> {
    this.seed()
    return this.readSeries().find((s) => s.id === id) ?? null
  }

  async search(query: string): Promise<CatalogItem[]> {
    this.seed()
    const q = query.toLowerCase()
    const movies = this.readMovies().filter(
      (m) => m.title.toLowerCase().includes(q) || m.originalTitle?.toLowerCase().includes(q)
    )
    const series = this.readSeries().filter(
      (s) => s.title.toLowerCase().includes(q) || s.originalTitle?.toLowerCase().includes(q)
    )
    return [...movies, ...series]
  }

  async addItem(data: AddItemDTO): Promise<CatalogItem> {
    const base = { id: generateId(), providerId: 'manual' as const, createdAt: new Date() }

    switch (data.contentType) {
      case 'movie': {
        const item: Movie = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_MOVIES, [...this.readMovies(), item])
        return item
      }
      case 'series': {
        const item: Series = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_SERIES, [...this.readSeries(), item])
        return item
      }
      case 'music': {
        const item: MusicAlbum = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_MUSIC, [...this.readMusic(), item])
        return item
      }
      case 'game': {
        const item: Game = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_GAMES, [...this.readGames(), item])
        return item
      }
      case 'book': {
        const item: Book = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_BOOKS, [...this.readBooks(), item])
        return item
      }
      case 'podcast': {
        const item: Podcast = { ...data, ...base }
        setToStorage(STORAGE_KEYS.CACHE_PODCASTS, [...this.readPodcasts(), item])
        return item
      }
    }
  }
}
