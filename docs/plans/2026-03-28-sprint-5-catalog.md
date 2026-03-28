# Sprint 5 — Content Catalog Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar el catálogo de contenido: páginas de Movies y Series con un listado de ítems mock, detalle de cada ítem con su review existente (si hay), y la posibilidad de crear una review directamente desde el detalle, reemplazando el campo `contentId` crudo del `ReviewForm`.

**Architecture:** Feature-Sliced Design. Todo vive en `src/features/catalog/`. Los ítems del catálogo viven en localStorage (mock estático seeded al primer uso) vía un nuevo `CatalogService`. El `ReviewForm` existente se extiende con `initialValues` para pre-poblar `contentId` y `contentType` cuando se abre desde un ítem. El `ReviewCard` se mejora para mostrar el título del ítem en vez del ID crudo. Las rutas `MOVIE_DETAIL` y `SERIES_DETAIL` ya existen en `ROUTES`.

**Tech Stack:** Next.js 16 App Router, shadcn/ui (Base UI / base-mira), Zustand 5 + Immer, TanStack Query v5, TypeScript strict, Tailwind 4. Package manager: `bun`.

---

## Contexto del proyecto

**Servicios disponibles (`src/shared/services/`):**
- `services.users.get()` → `Promise<User | null>`
- `services.reviews.getAll()` → `Promise<Review[]>`
- `services.reviews.getByUserId(userId)` → `Promise<Review[]>`
- `services.reviews.getByContentId(contentId)` → `Promise<Review[]>`
- `services.reviews.create(data)` → `Promise<Review>`
- `services.reviews.update(id, data)` → `Promise<Review>`
- `services.reviews.delete(id)` → `Promise<void>`

**Nuevo servicio que hay que crear (`src/shared/services/catalog.service.ts`):**
- `services.catalog.getMovies()` → `Promise<Movie[]>`
- `services.catalog.getMovieById(id)` → `Promise<Movie | null>`
- `services.catalog.getSeries()` → `Promise<Series[]>`
- `services.catalog.getSeriesById(id)` → `Promise<Series | null>`
- `services.catalog.search(query)` → `Promise<(Movie | Series)[]>`

El servicio usa localStorage con `STORAGE_KEYS.CACHE_MOVIES` y `STORAGE_KEYS.CACHE_SERIES`. Si el storage está vacío, siembra datos mock la primera vez (seed de 8 películas + 8 series hardcodeadas).

**Store Zustand (`src/shared/lib/store/index.ts`):**
- `useUser()` → selector del usuario actual
- `useReviews()` → selector de la lista de reviews en memoria
- `useStore((s) => s.reviews)` → acceso directo a reviews
- `useStore((s) => s.addReview)` → acción para agregar una review
- `useStore((s) => s.updateReview)` → acción para actualizar una review
- `useStore((s) => s.removeReview)` → acción para eliminar una review

**Tipos relevantes (`src/entities/movie/types.ts`):**
```typescript
interface Movie extends ReviewableItem {
  contentType: 'movie'
  originalTitle?: string
  runtime?: number
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  releaseDate: string
}
```

**Tipos relevantes (`src/entities/series/types.ts`):**
```typescript
interface Series extends ReviewableItem {
  contentType: 'series'
  originalTitle?: string
  firstAirDate: string
  lastAirDate?: string
  numberOfSeasons: number
  numberOfEpisodes: number
  status: SeriesStatus
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  networks?: Network[]
}
```

**Tipo base `ReviewableItem` (`src/shared/types/index.ts`):**
```typescript
interface ReviewableItem {
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
```

**Rutas actuales (`ROUTES` en `src/shared/constants/index.ts`):**
```typescript
ROUTES.MOVIES = '/movies'
ROUTES.MOVIE_DETAIL = (id: string) => `/movies/${id}`
ROUTES.SERIES = '/series'
ROUTES.SERIES_DETAIL = (id: string) => `/series/${id}`
```

**Storage keys disponibles (`STORAGE_KEYS`):**
```typescript
CACHE_MOVIES: 'things-review:cache:movies'
CACHE_SERIES: 'things-review:cache:series'
```

**Patrones TanStack Form v1 — OBLIGATORIO:**

NO pasar genérico explícito: ~~`useForm<MyType>({})`~~ — provoca error TypeScript "Expected 12 type args".
CORRECTO: dejar que TypeScript infiera desde `defaultValues`:
```typescript
type FormData = z.input<typeof schema>
const defaultValues: FormData = { ... }
const form = useForm({ defaultValues, ... })
```

`form.Subscribe` necesita `as const`:
```typescript
<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
```

Los errores de campos son `unknown[]`. Helper para mostrarlos:
```typescript
function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}
```

**`ReviewForm` existente (`src/features/reviews/components/ReviewForm.tsx`):**
Acepta `initialValues?: Partial<ReviewFormValues>` para pre-poblar campos. Ya está implementado — se puede usar directamente pasando `initialValues: { contentId: item.id, contentType: item.contentType }`.

**Lo que hay que crear:**
- `src/shared/services/catalog.service.ts` — nuevo servicio con seed mock
- `src/shared/services/index.ts` — agregar `catalog` al container
- `src/features/catalog/` — feature completa
- `src/app/(app)/movies/page.tsx` — reemplazar placeholder
- `src/app/(app)/movies/[id]/page.tsx` — crear
- `src/app/(app)/series/page.tsx` — reemplazar placeholder
- `src/app/(app)/series/[id]/page.tsx` — crear

**Lo que hay que modificar:**
- `src/features/reviews/components/ReviewCard.tsx` — mostrar título del ítem en footer

---

## Task 1: CatalogService con seed mock

Crear el servicio de catálogo local con datos mock. Sin API externa — todo localStorage + seed hardcodeado.

**Files:**
- Create: `src/shared/services/catalog.service.ts`
- Modify: `src/shared/services/index.ts`

**Step 1: Crear `src/shared/services/catalog.service.ts`**

```typescript
// src/shared/services/catalog.service.ts
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export type CatalogItem = Movie | Series

export interface ICatalogService {
  getMovies(): Promise<Movie[]>
  getMovieById(id: string): Promise<Movie | null>
  getSeries(): Promise<Series[]>
  getSeriesById(id: string): Promise<Series | null>
  search(query: string): Promise<CatalogItem[]>
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
}
```

**Step 2: Actualizar `src/shared/services/index.ts`**

Agregar `catalog` al container:

```typescript
// src/shared/services/index.ts
import { LocalUserService } from './user.service'
import { LocalReviewService } from './review.service'
import { LocalGroupService } from './group.service'
import { LocalCatalogService } from './catalog.service'

export const services = {
  users: new LocalUserService(),
  reviews: new LocalReviewService(),
  groups: new LocalGroupService(),
  catalog: new LocalCatalogService(),
} as const

export type Services = typeof services

export type { IUserService } from './user.service'
export type { IReviewService } from './review.service'
export type { IGroupService } from './group.service'
export type { ICatalogService, CatalogItem } from './catalog.service'
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/shared/services/catalog.service.ts src/shared/services/index.ts
git commit -m "feat: add catalog service with movie and series mock data"
```

---

## Task 2: Query hooks del catálogo

Crear los hooks de TanStack Query para el catálogo. Mismo patrón que `src/features/reviews/hooks/` y `src/features/groups/hooks/`.

**Files:**
- Create: `src/features/catalog/hooks/useCatalog.ts`
- Create: `src/features/catalog/hooks/index.ts`

**Step 1: Crear `src/features/catalog/hooks/useCatalog.ts`**

```typescript
// src/features/catalog/hooks/useCatalog.ts
import { useQuery } from '@tanstack/react-query'
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
```

**Step 2: Crear barrel `src/features/catalog/hooks/index.ts`**

```typescript
// src/features/catalog/hooks/index.ts
export {
  useMovies,
  useMovie,
  useSeriesList,
  useSeriesItem,
  MOVIES_QUERY_KEY,
  SERIES_QUERY_KEY,
} from './useCatalog'
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/hooks/
git commit -m "feat: add catalog query hooks"
```

---

## Task 3: CatalogItemCard — card visual para un ítem del catálogo

Componente atómico que muestra portada, título, año, géneros y si el usuario ya lo tiene en su lista.

**Files:**
- Create: `src/features/catalog/components/CatalogItemCard.tsx`

**Step 1: Crear `src/features/catalog/components/CatalogItemCard.tsx`**

```tsx
// src/features/catalog/components/CatalogItemCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { StarIcon } from 'lucide-react'
import { ROUTES } from '@/shared/constants'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'

type CatalogItemCardProps =
  | { item: Movie; hasReview: boolean }
  | { item: Series; hasReview: boolean }

export function CatalogItemCard({ item, hasReview }: CatalogItemCardProps) {
  const href =
    item.contentType === 'movie'
      ? ROUTES.MOVIE_DETAIL(item.id)
      : ROUTES.SERIES_DETAIL(item.id)

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full bg-muted overflow-hidden">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center px-2">
            {item.title}
          </div>
        )}
        {hasReview && (
          <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-1 shadow">
            <StarIcon className="size-3 text-primary-foreground fill-primary-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-medium leading-snug line-clamp-2">{item.title}</p>
        <p className="text-[10px] text-muted-foreground">{item.year}</p>
      </div>
    </Link>
  )
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 3: Commit**

```bash
git add src/features/catalog/components/CatalogItemCard.tsx
git commit -m "feat: add CatalogItemCard component"
```

---

## Task 4: MoviesPage — listado de películas

Implementar `src/app/(app)/movies/page.tsx`. Grid de posters con indicador de review existente.

**Files:**
- Create: `src/features/catalog/components/MoviesPage.tsx`
- Modify: `src/app/(app)/movies/page.tsx`

**Step 1: Crear `src/features/catalog/components/MoviesPage.tsx`**

```tsx
// src/features/catalog/components/MoviesPage.tsx
'use client'

import { FilmIcon } from 'lucide-react'
import { EmptyState } from '@/shared/ui/atoms'
import { useStore } from '@/shared/lib/store'
import { useMovies } from '../hooks'
import { CatalogItemCard } from './CatalogItemCard'

export function MoviesPage() {
  const { data: movies = [], isLoading } = useMovies()
  const reviews = useStore((s) => s.reviews)

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Movies</h1>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">{movies.length} titles</span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <EmptyState
          icon={<FilmIcon className="size-6" />}
          title="No movies in catalog"
          description="The catalog will populate on next load."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <CatalogItemCard
              key={movie.id}
              item={movie}
              hasReview={reviewedContentIds.has(movie.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Reemplazar `src/app/(app)/movies/page.tsx`**

```tsx
// src/app/(app)/movies/page.tsx
import { MoviesPage } from '@/features/catalog/components'

export default function MoviesRoute() {
  return <MoviesPage />
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/components/MoviesPage.tsx src/app/(app)/movies/page.tsx
git commit -m "feat: add movies catalog page"
```

---

## Task 5: MovieDetailPage — detalle de película con review

Página de detalle. Muestra backdrop, poster, info completa, y la review del usuario si existe (con opción de crear o editar).

**Files:**
- Create: `src/features/catalog/components/MovieDetailPage.tsx`
- Create: `src/app/(app)/movies/[id]/page.tsx`

**Step 1: Crear `src/features/catalog/components/MovieDetailPage.tsx`**

```tsx
// src/features/catalog/components/MovieDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, PlusIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { useStore } from '@/shared/lib/store'
import { useDeleteReview } from '@/features/reviews/hooks'
import { useMovie } from '../hooks'

interface MovieDetailPageProps {
  movieId: string
}

type DialogMode = 'none' | 'create' | 'edit'

export function MovieDetailPage({ movieId }: MovieDetailPageProps) {
  const router = useRouter()
  const { data: movie, isLoading } = useMovie(movieId)
  const reviews = useStore((s) => s.reviews)
  const deleteReview = useDeleteReview()
  const [dialog, setDialog] = useState<DialogMode>('none')

  const existingReview = reviews.find((r) => r.contentId === movieId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Back
        </Button>
        <p className="text-muted-foreground">Movie not found.</p>
      </div>
    )
  }

  const runtimeFormatted = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null

  return (
    <div className="flex flex-1 flex-col">
      {/* Backdrop */}
      {movie.backdropImageUrl && (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <Image
            src={movie.backdropImageUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl -mt-8 relative">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Movies
        </Button>

        {/* Header */}
        <div className="flex gap-4">
          {/* Poster */}
          {movie.coverImageUrl && (
            <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md sm:w-32">
              <Image
                src={movie.coverImageUrl}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          )}

          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-muted-foreground italic">{movie.originalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{movie.year}</span>
              {runtimeFormatted && <span>· {runtimeFormatted}</span>}
              <span>· {movie.originalLanguage.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.genres.map((g) => (
                <Badge key={g.id} variant="outline" className="text-[10px]">{g.name}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {movie.overview && (
          <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
        )}

        {/* Review section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              My Review
            </h2>
            {!existingReview ? (
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                Add Review
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon />
                Edit
              </Button>
            )}
          </div>

          {existingReview ? (
            <ReviewCard
              review={existingReview}
              onDelete={async (r) => {
                await deleteReview.mutateAsync(r.id)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You haven&apos;t reviewed this movie yet.</p>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialog !== 'none'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Add Review' : 'Edit Review'}</DialogTitle>
          </DialogHeader>
          {dialog !== 'none' && (
            <ReviewForm
              mode={dialog === 'create' ? 'create' : 'edit'}
              review={dialog === 'edit' ? existingReview : undefined}
              initialValues={dialog === 'create' ? { contentId: movie.id, contentType: 'movie' } : undefined}
              onSuccess={() => setDialog('none')}
              onCancel={() => setDialog('none')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 2: Crear `src/app/(app)/movies/[id]/page.tsx`**

```tsx
// src/app/(app)/movies/[id]/page.tsx
import { MovieDetailPage } from '@/features/catalog/components'

interface MovieDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function MovieDetailRoute({ params }: MovieDetailRouteProps) {
  const { id } = await params
  return <MovieDetailPage movieId={id} />
}
```

> **Nota Next.js 16:** `params` es una `Promise`. Hacer `await params` en Server Components.

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/components/MovieDetailPage.tsx "src/app/(app)/movies/[id]/"
git commit -m "feat: add movie detail page with review integration"
```

---

## Task 6: SeriesPage — listado de series

Mismo patrón que MoviesPage.

**Files:**
- Create: `src/features/catalog/components/SeriesPage.tsx`
- Modify: `src/app/(app)/series/page.tsx`

**Step 1: Crear `src/features/catalog/components/SeriesPage.tsx`**

```tsx
// src/features/catalog/components/SeriesPage.tsx
'use client'

import { TvIcon } from 'lucide-react'
import { EmptyState } from '@/shared/ui/atoms'
import { useStore } from '@/shared/lib/store'
import { useSeriesList } from '../hooks'
import { CatalogItemCard } from './CatalogItemCard'

export function SeriesPage() {
  const { data: seriesList = [], isLoading } = useSeriesList()
  const reviews = useStore((s) => s.reviews)

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Series</h1>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">{seriesList.length} titles</span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <EmptyState
          icon={<TvIcon className="size-6" />}
          title="No series in catalog"
          description="The catalog will populate on next load."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {seriesList.map((series) => (
            <CatalogItemCard
              key={series.id}
              item={series}
              hasReview={reviewedContentIds.has(series.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Reemplazar `src/app/(app)/series/page.tsx`**

```tsx
// src/app/(app)/series/page.tsx
import { SeriesPage } from '@/features/catalog/components'

export default function SeriesRoute() {
  return <SeriesPage />
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/components/SeriesPage.tsx src/app/(app)/series/page.tsx
git commit -m "feat: add series catalog page"
```

---

## Task 7: SeriesDetailPage — detalle de serie con review

Mismo patrón que MovieDetailPage, con campos específicos de series (temporadas, episodios, estado).

**Files:**
- Create: `src/features/catalog/components/SeriesDetailPage.tsx`
- Create: `src/app/(app)/series/[id]/page.tsx`

**Step 1: Crear `src/features/catalog/components/SeriesDetailPage.tsx`**

```tsx
// src/features/catalog/components/SeriesDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, PlusIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { useStore } from '@/shared/lib/store'
import { useDeleteReview } from '@/features/reviews/hooks'
import { useSeriesItem } from '../hooks'

interface SeriesDetailPageProps {
  seriesId: string
}

type DialogMode = 'none' | 'create' | 'edit'

const SERIES_STATUS_LABELS: Record<string, string> = {
  returning_series: 'Returning',
  ended: 'Ended',
  canceled: 'Canceled',
  in_production: 'In Production',
  planned: 'Planned',
}

export function SeriesDetailPage({ seriesId }: SeriesDetailPageProps) {
  const router = useRouter()
  const { data: series, isLoading } = useSeriesItem(seriesId)
  const reviews = useStore((s) => s.reviews)
  const deleteReview = useDeleteReview()
  const [dialog, setDialog] = useState<DialogMode>('none')

  const existingReview = reviews.find((r) => r.contentId === seriesId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Back
        </Button>
        <p className="text-muted-foreground">Series not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Backdrop */}
      {series.backdropImageUrl && (
        <div className="relative h-48 w-full overflow-hidden sm:h-64">
          <Image
            src={series.backdropImageUrl}
            alt={series.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl -mt-8 relative">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Series
        </Button>

        {/* Header */}
        <div className="flex gap-4">
          {/* Poster */}
          {series.coverImageUrl && (
            <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md sm:w-32">
              <Image
                src={series.coverImageUrl}
                alt={series.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          )}

          <div className="flex-1 space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">{series.title}</h1>
            {series.originalTitle && series.originalTitle !== series.title && (
              <p className="text-xs text-muted-foreground italic">{series.originalTitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{series.year}</span>
              <span>· {series.numberOfSeasons} {series.numberOfSeasons === 1 ? 'season' : 'seasons'}</span>
              <span>· {series.numberOfEpisodes} eps</span>
              <span>· {series.originalLanguage.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">
                {SERIES_STATUS_LABELS[series.status] ?? series.status}
              </Badge>
              {series.genres.map((g) => (
                <Badge key={g.id} variant="outline" className="text-[10px]">{g.name}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {series.overview && (
          <p className="text-sm text-muted-foreground leading-relaxed">{series.overview}</p>
        )}

        {/* Review section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              My Review
            </h2>
            {!existingReview ? (
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                Add Review
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDialog('edit')}>
                <PencilIcon />
                Edit
              </Button>
            )}
          </div>

          {existingReview ? (
            <ReviewCard
              review={existingReview}
              onDelete={async (r) => {
                await deleteReview.mutateAsync(r.id)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">You haven&apos;t reviewed this series yet.</p>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialog !== 'none'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Add Review' : 'Edit Review'}</DialogTitle>
          </DialogHeader>
          {dialog !== 'none' && (
            <ReviewForm
              mode={dialog === 'create' ? 'create' : 'edit'}
              review={dialog === 'edit' ? existingReview : undefined}
              initialValues={dialog === 'create' ? { contentId: series.id, contentType: 'series' } : undefined}
              onSuccess={() => setDialog('none')}
              onCancel={() => setDialog('none')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 2: Crear `src/app/(app)/series/[id]/page.tsx`**

```tsx
// src/app/(app)/series/[id]/page.tsx
import { SeriesDetailPage } from '@/features/catalog/components'

interface SeriesDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function SeriesDetailRoute({ params }: SeriesDetailRouteProps) {
  const { id } = await params
  return <SeriesDetailPage seriesId={id} />
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/components/SeriesDetailPage.tsx "src/app/(app)/series/[id]/"
git commit -m "feat: add series detail page with review integration"
```

---

## Task 8: Barrel de components + mejorar ReviewCard footer

Crear el barrel de la feature y mejorar el `ReviewCard` para mostrar el título del ítem (si está en el catálogo) en lugar del `contentId` crudo.

**Files:**
- Create: `src/features/catalog/components/index.ts`
- Modify: `src/features/reviews/components/ReviewCard.tsx`

**Step 1: Crear barrel `src/features/catalog/components/index.ts`**

```typescript
// src/features/catalog/components/index.ts
export { CatalogItemCard } from './CatalogItemCard'
export { MovieDetailPage } from './MovieDetailPage'
export { MoviesPage } from './MoviesPage'
export { SeriesDetailPage } from './SeriesDetailPage'
export { SeriesPage } from './SeriesPage'
```

**Step 2: Mejorar `ReviewCard` — mostrar título del ítem**

El footer actual muestra `ID: <code>{review.contentId}</code>` — algo que no tiene sentido para el usuario. Se reemplaza por un hook que busca el título en el catálogo de movies/series en el store de TanStack Query (cache), y si no lo encuentra, muestra el contentId como fallback.

Agregar hook utilitario en `src/features/catalog/hooks/useCatalog.ts`:

```typescript
// Agregar al final de src/features/catalog/hooks/useCatalog.ts
import { useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/entities/movie/types'
import type { Series } from '@/entities/series/types'

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
```

Actualizar el barrel `src/features/catalog/hooks/index.ts` para incluir el nuevo export:

```typescript
// src/features/catalog/hooks/index.ts
export {
  useMovies,
  useMovie,
  useSeriesList,
  useSeriesItem,
  useCatalogItemTitle,
  MOVIES_QUERY_KEY,
  SERIES_QUERY_KEY,
} from './useCatalog'
```

Modificar `src/features/reviews/components/ReviewCard.tsx` — reemplazar el footer:

```tsx
// Cambiar el import al inicio del archivo — agregar:
import { useCatalogItemTitle } from '@/features/catalog/hooks'

// Dentro de ReviewCard, antes del return, agregar:
const itemTitle = useCatalogItemTitle(review.contentId)

// Reemplazar el footer (lines 65-70) de:
<div className="flex items-center justify-between text-xs text-muted-foreground">
  <span>ID: <code className="font-mono">{review.contentId}</code></span>
  <span>{formatDate(review.createdAt)}</span>
</div>

// Por:
<div className="flex items-center justify-between text-xs text-muted-foreground">
  <span className="truncate max-w-[60%]">{itemTitle ?? review.contentId}</span>
  <span className="shrink-0">{formatDate(review.createdAt)}</span>
</div>
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/catalog/components/index.ts src/features/catalog/hooks/ src/features/reviews/components/ReviewCard.tsx
git commit -m "feat: add catalog components barrel and show item title in ReviewCard"
```

---

## Verificación final

**Step 1: TypeScript limpio**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 2: Revisar commits del sprint**

```bash
git log --oneline -10
```

Expected (de más reciente a más antiguo):
```
feat: add catalog components barrel and show item title in ReviewCard
feat: add series detail page with review integration
feat: add series catalog page
feat: add movie detail page with review integration
feat: add movies catalog page
feat: add CatalogItemCard component
feat: add catalog query hooks
feat: add catalog service with movie and series mock data
feat: add group detail page with invite code and reviews  ← último de Sprint 4
```

**Step 3: Verificar estructura nueva del sprint**

```bash
find src/features/catalog "src/app/(app)/movies" "src/app/(app)/series" -type f | sort
```

Expected:
```
src/app/(app)/movies/[id]/page.tsx
src/app/(app)/movies/page.tsx
src/app/(app)/series/[id]/page.tsx
src/app/(app)/series/page.tsx
src/features/catalog/components/CatalogItemCard.tsx
src/features/catalog/components/MovieDetailPage.tsx
src/features/catalog/components/MoviesPage.tsx
src/features/catalog/components/SeriesDetailPage.tsx
src/features/catalog/components/SeriesPage.tsx
src/features/catalog/components/index.ts
src/features/catalog/hooks/index.ts
src/features/catalog/hooks/useCatalog.ts
```
