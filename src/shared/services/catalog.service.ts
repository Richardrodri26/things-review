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
  getMusic(): Promise<MusicAlbum[]>
  getGames(): Promise<Game[]>
  getBooks(): Promise<Book[]>
  getPodcasts(): Promise<Podcast[]>
  getByType(contentType: CatalogItem['contentType']): Promise<CatalogItem[]>
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

const MOCK_MUSIC: Omit<MusicAlbum, 'id' | 'createdAt'>[] = [
  {
    contentType: 'music',
    providerId: 'mock',
    title: 'To Pimp a Butterfly',
    year: 2015,
    genres: [{ id: 'g-hiphop', name: 'Hip-Hop', applicableTo: ['music'] }],
    overview: 'Third studio album by Kendrick Lamar, exploring themes of race, culture, and identity.',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png',
    artist: 'Kendrick Lamar',
    albumType: 'album',
    totalTracks: 16,
    durationMs: 4537000,
    label: 'Aftermath / Interscope',
  },
  {
    contentType: 'music',
    providerId: 'mock',
    title: 'OK Computer',
    year: 1997,
    genres: [{ id: 'g-rock', name: 'Alternative Rock', applicableTo: ['music'] }],
    overview: "Radiohead's third studio album, widely considered one of the greatest albums ever made.",
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png',
    artist: 'Radiohead',
    albumType: 'album',
    totalTracks: 12,
    durationMs: 3317000,
    label: 'Parlophone / Capitol',
  },
  {
    contentType: 'music',
    providerId: 'mock',
    title: 'Blonde',
    year: 2016,
    genres: [{ id: 'g-rnb', name: 'R&B', applicableTo: ['music'] }, { id: 'g-soul', name: 'Soul', applicableTo: ['music'] }],
    overview: "Frank Ocean's second studio album, an experimental R&B record acclaimed for its introspective lyricism.",
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a0/Frank_Ocean_-_Blonde.png',
    artist: 'Frank Ocean',
    albumType: 'album',
    totalTracks: 17,
    durationMs: 3720000,
    label: "Boys Don't Cry",
  },
  {
    contentType: 'music',
    providerId: 'mock',
    title: 'Random Access Memories',
    year: 2013,
    genres: [{ id: 'g-disco', name: 'Disco', applicableTo: ['music'] }, { id: 'g-funk', name: 'Funk', applicableTo: ['music'] }],
    overview: "Daft Punk's fourth studio album, a love letter to 70s and 80s music featuring live instrumentation.",
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
    artist: 'Daft Punk',
    albumType: 'album',
    totalTracks: 13,
    durationMs: 4424000,
    label: 'Columbia',
  },
]

const MOCK_GAMES: Omit<Game, 'id' | 'createdAt'>[] = [
  {
    contentType: 'game',
    providerId: 'mock',
    title: 'The Last of Us Part I',
    year: 2022,
    genres: [{ id: 'g-action', name: 'Action-Adventure', applicableTo: ['game'] }, { id: 'g-survival', name: 'Survival', applicableTo: ['game'] }],
    overview: 'A third-person action-adventure game set in a post-apocalyptic world where players follow Joel and Ellie.',
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
    developer: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    platforms: ['playstation_5', 'pc'],
  },
  {
    contentType: 'game',
    providerId: 'mock',
    title: 'Elden Ring',
    year: 2022,
    genres: [{ id: 'g-rpg', name: 'RPG', applicableTo: ['game'] }, { id: 'g-action', name: 'Action', applicableTo: ['game'] }],
    overview: "An action RPG set in a vast open world developed by FromSoftware and written by George R.R. Martin.",
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png',
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    platforms: ['playstation_5', 'xbox_series', 'pc'],
  },
  {
    contentType: 'game',
    providerId: 'mock',
    title: 'Disco Elysium',
    year: 2019,
    genres: [{ id: 'g-rpg', name: 'RPG', applicableTo: ['game'] }],
    overview: 'A groundbreaking open-world role playing game set in a unique city where morality is gone and all is uncharted.',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Disco_Elysium_cover_art.jpg',
    developer: 'ZA/UM',
    publisher: 'ZA/UM',
    platforms: ['pc', 'playstation_4', 'nintendo_switch'],
  },
  {
    contentType: 'game',
    providerId: 'mock',
    title: 'Hollow Knight',
    year: 2017,
    genres: [{ id: 'g-metroidvania', name: 'Metroidvania', applicableTo: ['game'] }, { id: 'g-platformer', name: 'Platformer', applicableTo: ['game'] }],
    overview: 'A challenging 2D action-adventure game set in a vast, ancient kingdom beneath the surface.',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Hollow_Knight.png',
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    platforms: ['pc', 'nintendo_switch', 'playstation_4'],
  },
]

const MOCK_BOOKS: Omit<Book, 'id' | 'createdAt'>[] = [
  {
    contentType: 'book',
    providerId: 'mock',
    title: 'The Name of the Wind',
    year: 2007,
    genres: [{ id: 'g-fantasy', name: 'Fantasy', applicableTo: ['book'] }],
    overview: 'The tale of Kvothe, from his childhood in a troupe of traveling players to his years as a notorious young arcanist.',
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1270352123i/186074.jpg',
    author: ['Patrick Rothfuss'],
    isbn: '978-0-7564-0407-9',
    pageCount: 662,
    publisher: 'DAW Books',
    language: 'en',
  },
  {
    contentType: 'book',
    providerId: 'mock',
    title: 'Dune',
    year: 1965,
    genres: [{ id: 'g-scifi', name: 'Science Fiction', applicableTo: ['book'] }],
    overview: 'Set in the distant future amid a feudal interstellar society, this is the story of Paul Atreides and his journey on the desert planet Arrakis.',
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
    author: ['Frank Herbert'],
    isbn: '978-0-441-17271-9',
    pageCount: 412,
    publisher: 'Chilton Books',
    language: 'en',
  },
  {
    contentType: 'book',
    providerId: 'mock',
    title: 'The Pragmatic Programmer',
    year: 1999,
    genres: [{ id: 'g-tech', name: 'Technology', applicableTo: ['book'] }],
    overview: 'A timeless classic on software craftsmanship, pragmatic techniques, and professional development.',
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg',
    author: ['David Thomas', 'Andrew Hunt'],
    isbn: '978-0-201-61622-4',
    pageCount: 352,
    publisher: 'Addison-Wesley',
    language: 'en',
  },
  {
    contentType: 'book',
    providerId: 'mock',
    title: '100 años de soledad',
    year: 1967,
    genres: [{ id: 'g-magical-realism', name: 'Magical Realism', applicableTo: ['book'] }],
    overview: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo imaginario de Macondo.',
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327881361i/320.jpg',
    author: ['Gabriel García Márquez'],
    isbn: '978-0-06-088328-7',
    pageCount: 417,
    publisher: 'Editorial Sudamericana',
    language: 'es',
  },
]

const MOCK_PODCASTS: Omit<Podcast, 'id' | 'createdAt'>[] = [
  {
    contentType: 'podcast',
    providerId: 'mock',
    title: 'Lex Fridman Podcast',
    year: 2018,
    genres: [{ id: 'g-tech', name: 'Technology', applicableTo: ['podcast'] }, { id: 'g-science', name: 'Science', applicableTo: ['podcast'] }],
    overview: 'Conversations about science, technology, history, philosophy and the nature of intelligence, consciousness, love, and power.',
    host: ['Lex Fridman'],
    totalEpisodes: 450,
    language: 'en',
    isActive: true,
  },
  {
    contentType: 'podcast',
    providerId: 'mock',
    title: 'Syntax',
    year: 2017,
    genres: [{ id: 'g-tech', name: 'Technology', applicableTo: ['podcast'] }],
    overview: 'A Tasty Treats Podcast for Web Developers. Wes Bos and Scott Tolinski cover web development topics.',
    host: ['Wes Bos', 'Scott Tolinski'],
    totalEpisodes: 800,
    language: 'en',
    isActive: true,
  },
  {
    contentType: 'podcast',
    providerId: 'mock',
    title: 'Darknet Diaries',
    year: 2017,
    genres: [{ id: 'g-tech', name: 'Technology', applicableTo: ['podcast'] }, { id: 'g-true-crime', name: 'True Crime', applicableTo: ['podcast'] }],
    overview: 'True stories from the dark side of the internet. Hacking, cybersecurity, privacy, and more.',
    host: ['Jack Rhysider'],
    totalEpisodes: 150,
    language: 'en',
    isActive: true,
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

    const music = this.readMusic()
    if (music.length === 0) {
      const seeded: MusicAlbum[] = MOCK_MUSIC.map((m) => ({
        ...m,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_MUSIC, seeded)
    }

    const games = this.readGames()
    if (games.length === 0) {
      const seeded: Game[] = MOCK_GAMES.map((g) => ({
        ...g,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_GAMES, seeded)
    }

    const books = this.readBooks()
    if (books.length === 0) {
      const seeded: Book[] = MOCK_BOOKS.map((b) => ({
        ...b,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_BOOKS, seeded)
    }

    const podcasts = this.readPodcasts()
    if (podcasts.length === 0) {
      const seeded: Podcast[] = MOCK_PODCASTS.map((p) => ({
        ...p,
        id: generateId(),
        createdAt: new Date(),
      }))
      setToStorage(STORAGE_KEYS.CACHE_PODCASTS, seeded)
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

  async getMusic(): Promise<MusicAlbum[]> {
    this.seed()
    return this.readMusic()
  }

  async getGames(): Promise<Game[]> {
    this.seed()
    return this.readGames()
  }

  async getBooks(): Promise<Book[]> {
    this.seed()
    return this.readBooks()
  }

  async getPodcasts(): Promise<Podcast[]> {
    this.seed()
    return this.readPodcasts()
  }

  async getByType(contentType: CatalogItem['contentType']): Promise<CatalogItem[]> {
    this.seed()
    switch (contentType) {
      case 'movie':   return this.readMovies()
      case 'series':  return this.readSeries()
      case 'music':   return this.readMusic()
      case 'game':    return this.readGames()
      case 'book':    return this.readBooks()
      case 'podcast': return this.readPodcasts()
    }
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
