# Sprint 1 — Foundations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establecer las bases arquitectónicas completas del proyecto: estructura de carpetas, sistema de tipos, Zustand store con Immer, schemas Zod, capa de servicios localStorage, y setup de TanStack Query.

**Architecture:** Feature-Sliced Design (shared → entities → features → app). Los servicios son abstracciones con interfaces — hoy localStorage, mañana HTTP. TanStack Query maneja todo el async state, Zustand maneja el estado síncrono/UI.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Zod 4, Zustand 5 + Immer, TanStack Query v5, next-intl, shadcn/ui (base-mira style, ya instalado).

---

## Contexto del proyecto

El repo ya tiene:
- Next.js 16.2.1 con App Router
- React 19, TypeScript 5
- Tailwind 4 + shadcn (style `base-mira`)
- `components/ui/` con button, direction, item, separator
- `components.json` con aliases: `@/components`, `@/lib`, `@/hooks`

**Lo que NO tiene todavía:** aliases de path para `@/shared`, `@/entities`, `@/features`. Usaremos los aliases existentes de tsconfig y agregaremos los nuevos.

---

## Task 1: Instalar dependencias faltantes del Sprint 1

**Files:**
- Modify: `package.json`

**Step 1: Instalar dependencias de una sola vez**

```bash
cd /home/rrodriguez/richard/things-review && bun add zustand immer @tanstack/react-query @tanstack/react-query-devtools next-intl
```

**Step 2: Verificar instalación**

```bash
cat package.json | grep -E "(zustand|immer|tanstack|next-intl)"
```

Expected: Ver las 4 dependencias en `dependencies`.

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add zustand, immer, tanstack-query, next-intl dependencies"
```

---

## Task 2: Configurar aliases de TypeScript y estructura de carpetas base

**Files:**
- Modify: `tsconfig.json`
- Create: `shared/` (directorio vacío — las subcarpetas se crean en tasks siguientes)
- Create: `entities/` (directorio vacío)
- Create: `features/` (directorio vacío)

**Step 1: Verificar tsconfig actual**

```bash
cat tsconfig.json
```

**Step 2: Agregar aliases al tsconfig**

En `tsconfig.json`, dentro de `compilerOptions.paths`, agregar:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/shared/*": ["./shared/*"],
      "@/entities/*": ["./entities/*"],
      "@/features/*": ["./features/*"]
    }
  }
}
```

> **IMPORTANTE:** Preservar todas las keys existentes en paths. Solo AGREGAR las nuevas. Si ya existe `"@/*": ["./*"]`, no duplicar.

**Step 3: Crear estructura de carpetas base**

```bash
mkdir -p shared/ui/atoms shared/ui/molecules shared/ui/organisms
mkdir -p shared/lib shared/hooks shared/utils shared/types shared/constants shared/services shared/schemas
mkdir -p entities/movie entities/series entities/review entities/group entities/user
mkdir -p features
```

**Step 4: Verificar estructura**

```bash
find shared entities features -type d | sort
```

Expected: Ver todos los directorios creados.

**Step 5: Commit**

```bash
git add tsconfig.json shared/ entities/ features/
git commit -m "chore: setup feature-sliced design folder structure and path aliases"
```

---

## Task 3: Crear tipos base del dominio

**Files:**
- Create: `shared/types/index.ts`
- Create: `entities/user/types.ts`
- Create: `entities/movie/types.ts`
- Create: `entities/series/types.ts`
- Create: `entities/review/types.ts`
- Create: `entities/group/types.ts`

**Step 1: Crear `shared/types/index.ts`** — Tipos base compartidos

```typescript
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
```

**Step 2: Crear `entities/user/types.ts`**

```typescript
// entities/user/types.ts
import type { ContentType, Rating } from '@/shared/types'

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>
  recentActivity: unknown[] // ReviewWithUser[] — se tipará en review/types.ts
}

export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUserDTO = Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>
```

**Step 3: Crear `entities/movie/types.ts`**

```typescript
// entities/movie/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Movie extends ReviewableItem {
  contentType: 'movie'
  originalTitle?: string
  runtime?: number
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  releaseDate: string
}
```

**Step 4: Crear `entities/series/types.ts`**

```typescript
// entities/series/types.ts
import type { ReviewableItem } from '@/shared/types'

export const SERIES_STATUS = {
  RETURNING: 'returning_series',
  ENDED: 'ended',
  CANCELED: 'canceled',
  IN_PRODUCTION: 'in_production',
  PLANNED: 'planned',
} as const

export type SeriesStatus = (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS]

export interface Network {
  id: string
  name: string
  logoUrl?: string
}

export interface Series extends ReviewableItem {
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

**Step 5: Crear `entities/review/types.ts`**

```typescript
// entities/review/types.ts
import type {
  ContentType,
  ConsumptionStatus,
  Rating,
} from '@/shared/types'
import type { User } from '@/entities/user/types'
import type { GamePlatform } from '@/entities/game/types'

export interface SeriesReviewMetadata {
  contentType: 'series'
  currentSeason?: number
  currentEpisode?: number
  seasonRatings?: Record<number, Rating>
}

export interface GameReviewMetadata {
  contentType: 'game'
  platform?: GamePlatform
  hoursPlayed?: number
  completionPercent?: number
  difficulty?: 'easy' | 'normal' | 'hard' | 'very_hard'
}

export interface BookReviewMetadata {
  contentType: 'book'
  currentPage?: number
  readingFormat?: 'physical' | 'ebook' | 'audiobook'
}

export interface PodcastReviewMetadata {
  contentType: 'podcast'
  episodesListened?: number
}

export type ReviewMetadata =
  | SeriesReviewMetadata
  | GameReviewMetadata
  | BookReviewMetadata
  | PodcastReviewMetadata
  | null

export interface Review {
  id: string
  userId: string
  contentId: string
  contentType: ContentType
  rating?: Rating
  title?: string
  body?: string
  containsSpoilers: boolean
  status: ConsumptionStatus
  metadata?: ReviewMetadata
  consumedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export type CreateReviewDTO = Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateReviewDTO = Partial<Pick<Review,
  'rating' | 'title' | 'body' | 'containsSpoilers' | 'status' | 'consumedAt' | 'metadata'
>>
```

> **NOTA:** `review/types.ts` importa de `@/entities/game/types` para `GamePlatform`. Crear `entities/game/types.ts` antes o después (Task siguiente). El TS lo resolverá cuando ambos estén creados.

**Step 6: Crear `entities/game/types.ts`** (necesario para review/types.ts)

```typescript
// entities/game/types.ts
import type { ReviewableItem } from '@/shared/types'

export const GAME_PLATFORM = {
  PC: 'pc',
  PS5: 'playstation_5',
  PS4: 'playstation_4',
  XBOX_SERIES: 'xbox_series',
  XBOX_ONE: 'xbox_one',
  SWITCH: 'nintendo_switch',
  MOBILE: 'mobile',
  OTHER: 'other',
} as const

export type GamePlatform = (typeof GAME_PLATFORM)[keyof typeof GAME_PLATFORM]

export interface Game extends ReviewableItem {
  contentType: 'game'
  developer?: string
  publisher?: string
  platforms: GamePlatform[]
  metacriticScore?: number
}
```

**Step 7: Crear `entities/group/types.ts`**

```typescript
// entities/group/types.ts
import type {
  ContentType,
  GroupVisibility,
  GroupRole,
  Rating,
} from '@/shared/types'
import type { User } from '@/entities/user/types'
import type { ReviewWithUser } from '@/entities/review/types'
import type { ReviewableItem } from '@/shared/types'
import type { Review } from '@/entities/review/types'
import type { CommentWithAuthor } from '@/entities/comment/types'

export interface Group {
  id: string
  name: string
  description?: string
  avatarUrl?: string
  visibility: GroupVisibility
  inviteCode: string
  ownerId: string
  memberIds: string[]
  focusContentTypes?: ContentType[]
  createdAt: Date
  updatedAt: Date
}

export interface GroupMembership {
  userId: string
  groupId: string
  role: GroupRole
  joinedAt: Date
}

export interface GroupRatingSummary {
  contentId: string
  contentType: ContentType
  groupId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<Rating, number>
  reviews: ReviewWithUser[]
}

export interface ReviewInGroup extends ReviewWithUser {
  comments: CommentWithAuthor[]
  commentCount: number
}

export interface ReviewableItemWithUserReview {
  item: ReviewableItem
  userReview?: Review
}

export type CreateGroupDTO = Omit<Group, 'id' | 'inviteCode' | 'memberIds' | 'createdAt' | 'updatedAt'>
export type UpdateGroupDTO = Partial<Pick<Group, 'name' | 'description' | 'avatarUrl' | 'visibility' | 'focusContentTypes'>>
```

**Step 8: Crear `entities/comment/types.ts`** (necesario para group/types.ts)

```typescript
// entities/comment/types.ts
import type { User } from '@/entities/user/types'

export interface Comment {
  id: string
  reviewId: string
  groupId: string
  authorId: string
  body: string
  createdAt: Date
  updatedAt: Date
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export type CreateCommentDTO = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCommentDTO = Pick<Comment, 'body'>
```

**Step 9: Verificar que TypeScript compila sin errores**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

Expected: Sin errores. Si hay errores de import circular o tipos faltantes, resolverlos antes de continuar.

**Step 10: Commit**

```bash
git add shared/types/ entities/
git commit -m "feat: add domain type definitions for all entities"
```

---

## Task 4: Crear schemas Zod para todas las entidades

**Files:**
- Create: `shared/schemas/index.ts`
- Create: `entities/user/schema.ts`
- Create: `entities/movie/schema.ts`
- Create: `entities/series/schema.ts`
- Create: `entities/review/schema.ts`
- Create: `entities/group/schema.ts`
- Create: `entities/comment/schema.ts`

**Step 1: Verificar versión de Zod instalada**

```bash
cat node_modules/zod/package.json | grep '"version"'
```

> Si la versión es `>= 4.x`, usar la API de Zod 4 (`z.uuid()`, `z.email()`, error en vez de message).
> Si es `3.x`, usar la API de Zod 3 (`z.string().uuid()`, `message` en vez de `error`).

**Step 2: Instalar Zod si no está instalado**

```bash
bun add zod
```

**Step 3: Crear `shared/schemas/index.ts`** — Schemas base reutilizables

```typescript
// shared/schemas/index.ts
import { z } from 'zod'

// UUID genérico — reutilizable en todos los schemas
export const uuidSchema = z.string().uuid()

// Date como string ISO — para localStorage y forms
export const isoDateSchema = z.string().datetime()

// ContentType schema
export const contentTypeSchema = z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast'])

// Rating 1-5
export const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

// ConsumptionStatus
export const consumptionStatusSchema = z.enum([
  'consumed',
  'want_to_consume',
  'consuming',
  'dropped',
])

// GroupVisibility
export const groupVisibilitySchema = z.enum(['public', 'private'])

// GroupRole
export const groupRoleSchema = z.enum(['owner', 'admin', 'member'])

// Genre schema
export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEs: z.string().optional(),
  applicableTo: z.array(contentTypeSchema),
})
```

**Step 4: Crear `entities/user/schema.ts`**

```typescript
// entities/user/schema.ts
import { z } from 'zod'
import { uuidSchema } from '@/shared/schemas'

export const userSchema = z.object({
  id: uuidSchema,
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createUserDTOSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateUserDTOSchema = userSchema
  .pick({ displayName: true, avatarUrl: true, bio: true })
  .partial()
```

**Step 5: Crear `entities/movie/schema.ts`**

```typescript
// entities/movie/schema.ts
import { z } from 'zod'
import { uuidSchema, genreSchema } from '@/shared/schemas'

export const movieSchema = z.object({
  id: uuidSchema,
  contentType: z.literal('movie'),
  providerId: z.string(),
  externalId: z.string().optional(),
  title: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  year: z.number().int().min(1888).max(2100),
  genres: z.array(genreSchema),
  overview: z.string().optional(),
  originalTitle: z.string().optional(),
  runtime: z.number().int().positive().optional(),
  originalLanguage: z.string().length(2),
  adult: z.boolean(),
  backdropImageUrl: z.string().url().optional(),
  releaseDate: z.string(),
  createdAt: z.coerce.date(),
})
```

**Step 6: Crear `entities/series/schema.ts`**

```typescript
// entities/series/schema.ts
import { z } from 'zod'
import { uuidSchema, genreSchema } from '@/shared/schemas'

export const networkSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
})

export const seriesStatusSchema = z.enum([
  'returning_series',
  'ended',
  'canceled',
  'in_production',
  'planned',
])

export const seriesSchema = z.object({
  id: uuidSchema,
  contentType: z.literal('series'),
  providerId: z.string(),
  externalId: z.string().optional(),
  title: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  year: z.number().int().min(1888).max(2100),
  genres: z.array(genreSchema),
  overview: z.string().optional(),
  originalTitle: z.string().optional(),
  firstAirDate: z.string(),
  lastAirDate: z.string().optional(),
  numberOfSeasons: z.number().int().min(0),
  numberOfEpisodes: z.number().int().min(0),
  status: seriesStatusSchema,
  originalLanguage: z.string().length(2),
  adult: z.boolean(),
  backdropImageUrl: z.string().url().optional(),
  networks: z.array(networkSchema).optional(),
  createdAt: z.coerce.date(),
})
```

**Step 7: Crear `entities/review/schema.ts`**

```typescript
// entities/review/schema.ts
import { z } from 'zod'
import { uuidSchema, ratingSchema, consumptionStatusSchema, contentTypeSchema } from '@/shared/schemas'

export const gamePlatformSchema = z.enum([
  'pc', 'playstation_5', 'playstation_4', 'xbox_series',
  'xbox_one', 'nintendo_switch', 'mobile', 'other',
])

export const seriesReviewMetadataSchema = z.object({
  contentType: z.literal('series'),
  currentSeason: z.number().int().positive().optional(),
  currentEpisode: z.number().int().positive().optional(),
  seasonRatings: z.record(z.coerce.string(), ratingSchema).optional(),
})

export const gameReviewMetadataSchema = z.object({
  contentType: z.literal('game'),
  platform: gamePlatformSchema.optional(),
  hoursPlayed: z.number().min(0).optional(),
  completionPercent: z.number().min(0).max(100).optional(),
  difficulty: z.enum(['easy', 'normal', 'hard', 'very_hard']).optional(),
})

export const bookReviewMetadataSchema = z.object({
  contentType: z.literal('book'),
  currentPage: z.number().int().positive().optional(),
  readingFormat: z.enum(['physical', 'ebook', 'audiobook']).optional(),
})

export const podcastReviewMetadataSchema = z.object({
  contentType: z.literal('podcast'),
  episodesListened: z.number().int().min(0).optional(),
})

export const reviewMetadataSchema = z.union([
  seriesReviewMetadataSchema,
  gameReviewMetadataSchema,
  bookReviewMetadataSchema,
  podcastReviewMetadataSchema,
]).nullable().optional()

export const reviewSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  contentId: z.string(),
  contentType: contentTypeSchema,
  rating: ratingSchema.optional(),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
  containsSpoilers: z.boolean(),
  status: consumptionStatusSchema,
  metadata: reviewMetadataSchema,
  consumedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createReviewDTOSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateReviewDTOSchema = reviewSchema
  .pick({
    rating: true,
    title: true,
    body: true,
    containsSpoilers: true,
    status: true,
    consumedAt: true,
    metadata: true,
  })
  .partial()
```

**Step 8: Crear `entities/group/schema.ts`**

```typescript
// entities/group/schema.ts
import { z } from 'zod'
import { uuidSchema, groupVisibilitySchema, contentTypeSchema } from '@/shared/schemas'

export const groupSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
  visibility: groupVisibilitySchema,
  inviteCode: z.string().length(8),
  ownerId: uuidSchema,
  memberIds: z.array(uuidSchema),
  focusContentTypes: z.array(contentTypeSchema).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createGroupDTOSchema = groupSchema.omit({
  id: true,
  inviteCode: true,
  memberIds: true,
  createdAt: true,
  updatedAt: true,
})

export const updateGroupDTOSchema = groupSchema
  .pick({ name: true, description: true, avatarUrl: true, visibility: true, focusContentTypes: true })
  .partial()
```

**Step 9: Crear `entities/comment/schema.ts`**

```typescript
// entities/comment/schema.ts
import { z } from 'zod'
import { uuidSchema } from '@/shared/schemas'

export const commentSchema = z.object({
  id: uuidSchema,
  reviewId: uuidSchema,
  groupId: uuidSchema,
  authorId: uuidSchema,
  body: z.string().min(1).max(500),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createCommentDTOSchema = commentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateCommentDTOSchema = commentSchema.pick({ body: true })
```

**Step 10: Verificar compilación TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

Expected: Sin errores.

**Step 11: Commit**

```bash
git add shared/schemas/ entities/
git commit -m "feat: add zod schemas for all domain entities"
```

---

## Task 5: Constantes globales y utilidades base

**Files:**
- Create: `shared/constants/index.ts`
- Create: `shared/utils/cn.ts`
- Create: `shared/utils/index.ts`
- Create: `lib/utils.ts` — mantener el existente o crearlo si no existe

**Step 1: Verificar si existe `lib/utils.ts`**

```bash
cat lib/utils.ts 2>/dev/null || echo "NO EXISTE"
```

**Step 2: Crear o asegurarse que `lib/utils.ts` existe** (shadcn lo necesita)

Si no existe, crearlo con:
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 3: Crear `shared/utils/cn.ts`** — re-export para usar desde shared

```typescript
// shared/utils/cn.ts
export { cn } from '@/lib/utils'
```

**Step 4: Crear `shared/constants/index.ts`**

```typescript
// shared/constants/index.ts

// Routes de la app
export const ROUTES = {
  HOME: '/',
  MOVIES: '/movies',
  MOVIE_DETAIL: (id: string) => `/movies/${id}`,
  SERIES: '/series',
  SERIES_DETAIL: (id: string) => `/series/${id}`,
  REVIEWS: '/reviews',
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
  GC_TIME: 1000 * 60 * 60,         // 1 hora
  RETRY: 1,
} as const
```

**Step 5: Crear `shared/utils/index.ts`**

```typescript
// shared/utils/index.ts
export { cn } from './cn'

/**
 * Formatea una fecha a string legible
 */
export function formatDate(date: Date | string, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Genera un UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Genera un código de invitación de 8 caracteres alfanuméricos
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

/**
 * Calcula el promedio de un array de números
 */
export function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
```

**Step 6: Verificar TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add shared/constants/ shared/utils/ lib/
git commit -m "feat: add shared constants, utilities and route definitions"
```

---

## Task 6: Capa de servicios localStorage

**Files:**
- Create: `shared/services/localStorage.service.ts` — helper genérico
- Create: `shared/services/review.service.ts`
- Create: `shared/services/group.service.ts`
- Create: `shared/services/user.service.ts`
- Create: `shared/services/index.ts` — Service Container

**Step 1: Crear `shared/services/localStorage.service.ts`** — helper genérico

```typescript
// shared/services/localStorage.service.ts

/**
 * Helper genérico para leer/escribir en localStorage con serialización segura.
 * Todos los servicios usan esto internamente.
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error(`[Storage] Failed to write key: ${key}`)
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
```

**Step 2: Crear `shared/services/user.service.ts`**

```typescript
// shared/services/user.service.ts
import type { User, CreateUserDTO, UpdateUserDTO } from '@/entities/user/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage, removeFromStorage } from './localStorage.service'

export interface IUserService {
  get(): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
  update(data: UpdateUserDTO): Promise<User>
  delete(): Promise<void>
}

export class LocalUserService implements IUserService {
  async get(): Promise<User | null> {
    return getFromStorage<User | null>(STORAGE_KEYS.USER, null)
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setToStorage(STORAGE_KEYS.USER, user)
    return user
  }

  async update(data: UpdateUserDTO): Promise<User> {
    const current = await this.get()
    if (!current) throw new Error('No user found')
    const updated: User = {
      ...current,
      ...data,
      updatedAt: new Date(),
    }
    setToStorage(STORAGE_KEYS.USER, updated)
    return updated
  }

  async delete(): Promise<void> {
    removeFromStorage(STORAGE_KEYS.USER)
  }
}
```

**Step 3: Crear `shared/services/review.service.ts`**

```typescript
// shared/services/review.service.ts
import type { Review, CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface IReviewService {
  getAll(): Promise<Review[]>
  getById(id: string): Promise<Review | null>
  create(data: CreateReviewDTO): Promise<Review>
  update(id: string, data: UpdateReviewDTO): Promise<Review>
  delete(id: string): Promise<void>
  getByContentId(contentId: string): Promise<Review[]>
  getByUserId(userId: string): Promise<Review[]>
  getGroupReviews(groupId: string, contentId: string, memberIds: string[]): Promise<Review[]>
}

export class LocalReviewService implements IReviewService {
  private readAll(): Review[] {
    return getFromStorage<Review[]>(STORAGE_KEYS.REVIEWS, [])
  }

  private writeAll(reviews: Review[]): void {
    setToStorage(STORAGE_KEYS.REVIEWS, reviews)
  }

  async getAll(): Promise<Review[]> {
    return this.readAll()
  }

  async getById(id: string): Promise<Review | null> {
    return this.readAll().find(r => r.id === id) ?? null
  }

  async create(data: CreateReviewDTO): Promise<Review> {
    const review: Review = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeAll([...this.readAll(), review])
    return review
  }

  async update(id: string, data: UpdateReviewDTO): Promise<Review> {
    const all = this.readAll()
    const idx = all.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Review not found: ${id}`)
    const updated: Review = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter(r => r.id !== id))
  }

  async getByContentId(contentId: string): Promise<Review[]> {
    return this.readAll().filter(r => r.contentId === contentId)
  }

  async getByUserId(userId: string): Promise<Review[]> {
    return this.readAll().filter(r => r.userId === userId)
  }

  async getGroupReviews(
    _groupId: string,
    contentId: string,
    memberIds: string[]
  ): Promise<Review[]> {
    return this.readAll().filter(
      r => r.contentId === contentId && memberIds.includes(r.userId)
    )
  }
}
```

**Step 4: Crear `shared/services/group.service.ts`**

```typescript
// shared/services/group.service.ts
import type { Group, GroupMembership, CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import type { GroupRole } from '@/shared/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId, generateInviteCode } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface IGroupService {
  getAll(): Promise<Group[]>
  getById(id: string): Promise<Group | null>
  getByInviteCode(code: string): Promise<Group | null>
  create(data: CreateGroupDTO, ownerId: string): Promise<Group>
  update(id: string, data: UpdateGroupDTO): Promise<Group>
  delete(id: string): Promise<void>
  // Membership
  getMemberships(userId: string): Promise<GroupMembership[]>
  addMember(groupId: string, userId: string, role?: GroupRole): Promise<GroupMembership>
  removeMember(groupId: string, userId: string): Promise<void>
  getMemberIds(groupId: string): Promise<string[]>
}

export class LocalGroupService implements IGroupService {
  private readGroups(): Group[] {
    return getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, [])
  }

  private writeGroups(groups: Group[]): void {
    setToStorage(STORAGE_KEYS.GROUPS, groups)
  }

  private readMemberships(): GroupMembership[] {
    return getFromStorage<GroupMembership[]>(STORAGE_KEYS.MEMBERSHIPS, [])
  }

  private writeMemberships(memberships: GroupMembership[]): void {
    setToStorage(STORAGE_KEYS.MEMBERSHIPS, memberships)
  }

  async getAll(): Promise<Group[]> {
    return this.readGroups()
  }

  async getById(id: string): Promise<Group | null> {
    return this.readGroups().find(g => g.id === id) ?? null
  }

  async getByInviteCode(code: string): Promise<Group | null> {
    return this.readGroups().find(g => g.inviteCode === code) ?? null
  }

  async create(data: CreateGroupDTO, ownerId: string): Promise<Group> {
    const group: Group = {
      ...data,
      id: generateId(),
      inviteCode: generateInviteCode(),
      memberIds: [ownerId],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeGroups([...this.readGroups(), group])
    // Auto-agregar membresía del owner
    await this.addMember(group.id, ownerId, 'owner')
    return group
  }

  async update(id: string, data: UpdateGroupDTO): Promise<Group> {
    const all = this.readGroups()
    const idx = all.findIndex(g => g.id === id)
    if (idx === -1) throw new Error(`Group not found: ${id}`)
    const updated: Group = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeGroups(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.writeGroups(this.readGroups().filter(g => g.id !== id))
    this.writeMemberships(this.readMemberships().filter(m => m.groupId !== id))
  }

  async getMemberships(userId: string): Promise<GroupMembership[]> {
    return this.readMemberships().filter(m => m.userId === userId)
  }

  async addMember(groupId: string, userId: string, role: GroupRole = 'member'): Promise<GroupMembership> {
    const existing = this.readMemberships().find(
      m => m.groupId === groupId && m.userId === userId
    )
    if (existing) return existing

    const membership: GroupMembership = { userId, groupId, role, joinedAt: new Date() }
    this.writeMemberships([...this.readMemberships(), membership])

    // Actualizar memberIds del grupo
    const groups = this.readGroups()
    const groupIdx = groups.findIndex(g => g.id === groupId)
    if (groupIdx !== -1 && !groups[groupIdx].memberIds.includes(userId)) {
      groups[groupIdx].memberIds.push(userId)
      this.writeGroups(groups)
    }

    return membership
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    this.writeMemberships(
      this.readMemberships().filter(m => !(m.groupId === groupId && m.userId === userId))
    )
    const groups = this.readGroups()
    const groupIdx = groups.findIndex(g => g.id === groupId)
    if (groupIdx !== -1) {
      groups[groupIdx].memberIds = groups[groupIdx].memberIds.filter(id => id !== userId)
      this.writeGroups(groups)
    }
  }

  async getMemberIds(groupId: string): Promise<string[]> {
    return this.readMemberships()
      .filter(m => m.groupId === groupId)
      .map(m => m.userId)
  }
}
```

**Step 5: Crear `shared/services/index.ts`** — Service Container

```typescript
// shared/services/index.ts
import { LocalUserService } from './user.service'
import { LocalReviewService } from './review.service'
import { LocalGroupService } from './group.service'

// Service Container — cambiar implementaciones aquí cuando llegue el backend
export const services = {
  users: new LocalUserService(),
  reviews: new LocalReviewService(),
  groups: new LocalGroupService(),
} as const

export type Services = typeof services

// Re-export interfaces para uso en features/entities
export type { IUserService } from './user.service'
export type { IReviewService } from './review.service'
export type { IGroupService } from './group.service'
```

**Step 6: Verificar TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add shared/services/
git commit -m "feat: add localStorage service layer with IUserService, IReviewService, IGroupService"
```

---

## Task 7: Zustand store con Immer (slices por entidad)

**Files:**
- Create: `shared/lib/store/user.slice.ts`
- Create: `shared/lib/store/reviews.slice.ts`
- Create: `shared/lib/store/groups.slice.ts`
- Create: `shared/lib/store/ui.slice.ts`
- Create: `shared/lib/store/index.ts`

**Step 1: Crear `shared/lib/store/user.slice.ts`**

```typescript
// shared/lib/store/user.slice.ts
import type { StateCreator } from 'zustand'
import type { User } from '@/entities/user/types'

export interface UserSlice {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (data: Partial<User>) => void
}

export const createUserSlice: StateCreator<
  UserSlice,
  [['zustand/immer', never]],
  [],
  UserSlice
> = (set) => ({
  user: null,

  setUser: (user) =>
    set((state) => {
      state.user = user
    }),

  updateUser: (data) =>
    set((state) => {
      if (state.user) {
        Object.assign(state.user, data)
      }
    }),
})
```

**Step 2: Crear `shared/lib/store/reviews.slice.ts`**

```typescript
// shared/lib/store/reviews.slice.ts
import type { StateCreator } from 'zustand'
import type { Review } from '@/entities/review/types'

export interface ReviewsSlice {
  reviews: Review[]
  setReviews: (reviews: Review[]) => void
  addReview: (review: Review) => void
  updateReview: (id: string, data: Partial<Review>) => void
  removeReview: (id: string) => void
}

export const createReviewsSlice: StateCreator<
  ReviewsSlice,
  [['zustand/immer', never]],
  [],
  ReviewsSlice
> = (set) => ({
  reviews: [],

  setReviews: (reviews) =>
    set((state) => {
      state.reviews = reviews
    }),

  addReview: (review) =>
    set((state) => {
      state.reviews.push(review)
    }),

  updateReview: (id, data) =>
    set((state) => {
      const idx = state.reviews.findIndex(r => r.id === id)
      if (idx !== -1) Object.assign(state.reviews[idx], data)
    }),

  removeReview: (id) =>
    set((state) => {
      state.reviews = state.reviews.filter(r => r.id !== id)
    }),
})
```

**Step 3: Crear `shared/lib/store/groups.slice.ts`**

```typescript
// shared/lib/store/groups.slice.ts
import type { StateCreator } from 'zustand'
import type { Group } from '@/entities/group/types'

export interface GroupsSlice {
  groups: Group[]
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, data: Partial<Group>) => void
  removeGroup: (id: string) => void
}

export const createGroupsSlice: StateCreator<
  GroupsSlice,
  [['zustand/immer', never]],
  [],
  GroupsSlice
> = (set) => ({
  groups: [],

  setGroups: (groups) =>
    set((state) => {
      state.groups = groups
    }),

  addGroup: (group) =>
    set((state) => {
      state.groups.push(group)
    }),

  updateGroup: (id, data) =>
    set((state) => {
      const idx = state.groups.findIndex(g => g.id === id)
      if (idx !== -1) Object.assign(state.groups[idx], data)
    }),

  removeGroup: (id) =>
    set((state) => {
      state.groups = state.groups.filter(g => g.id !== id)
    }),
})
```

**Step 4: Crear `shared/lib/store/ui.slice.ts`** — estado de UI

```typescript
// shared/lib/store/ui.slice.ts
import type { StateCreator } from 'zustand'

export interface UISlice {
  // Overlays abiertos
  openOverlays: Set<string>
  openOverlay: (id: string) => void
  closeOverlay: (id: string) => void
  isOverlayOpen: (id: string) => boolean
}

export const createUISlice: StateCreator<
  UISlice,
  [['zustand/immer', never]],
  [],
  UISlice
> = (set, get) => ({
  openOverlays: new Set(),

  openOverlay: (id) =>
    set((state) => {
      state.openOverlays.add(id)
    }),

  closeOverlay: (id) =>
    set((state) => {
      state.openOverlays.delete(id)
    }),

  isOverlayOpen: (id) => get().openOverlays.has(id),
})
```

**Step 5: Crear `shared/lib/store/index.ts`** — Root store

```typescript
// shared/lib/store/index.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createUserSlice, type UserSlice } from './user.slice'
import { createReviewsSlice, type ReviewsSlice } from './reviews.slice'
import { createGroupsSlice, type GroupsSlice } from './groups.slice'
import { createUISlice, type UISlice } from './ui.slice'

export type RootState = UserSlice & ReviewsSlice & GroupsSlice & UISlice

export const useStore = create<RootState>()(
  devtools(
    immer((...args) => ({
      ...createUserSlice(...args),
      ...createReviewsSlice(...args),
      ...createGroupsSlice(...args),
      ...createUISlice(...args),
    })),
    { name: 'ThingsReviewStore' }
  )
)

// Selectores específicos — usar useShallow cuando se seleccionan múltiples campos
export const useUser = () => useStore((s) => s.user)
export const useReviews = () => useStore((s) => s.reviews)
export const useGroups = () => useStore((s) => s.groups)
```

**Step 6: Verificar TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

Si hay errores con el tipo de `Set` en Immer, reemplazar `openOverlays: Set<string>` por `openOverlays: string[]` y ajustar los métodos correspondientemente.

**Step 7: Commit**

```bash
git add shared/lib/store/
git commit -m "feat: add zustand store with immer - user, reviews, groups, ui slices"
```

---

## Task 8: Setup de TanStack Query

**Files:**
- Create: `shared/lib/query-client.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

**Step 1: Crear `shared/lib/query-client.ts`**

```typescript
// shared/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/shared/constants'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CONFIG.STALE_TIME,
        gcTime: QUERY_CONFIG.GC_TIME,
        retry: QUERY_CONFIG.RETRY,
        // Con localStorage no hay loading states reales — pero los dejamos para cuando sea HTTP
        refetchOnWindowFocus: false,
      },
    },
  })
}

// Singleton para client-side
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre nueva instancia
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
```

**Step 2: Crear `app/providers.tsx`** — Client Component con todos los providers

```typescript
// app/providers.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from '@/shared/lib/query-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Step 3: Leer el `app/layout.tsx` actual**

```bash
cat app/layout.tsx
```

**Step 4: Modificar `app/layout.tsx` para incluir Providers**

Envolver `{children}` con `<Providers>`. Mantener todo lo que ya existe (fonts, metadata, etc.). Solo agregar el import y el wrapper.

Ejemplo de lo que debe quedar (ajustar según el layout existente):
```tsx
import { Providers } from './providers'

// ... existing layout code ...

return (
  <html lang="en">
    <body>
      <Providers>
        {children}
      </Providers>
    </body>
  </html>
)
```

**Step 5: Verificar TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add shared/lib/query-client.ts app/providers.tsx app/layout.tsx
git commit -m "feat: setup TanStack Query with QueryClientProvider and devtools"
```

---

## Task 9: Setup de next-intl (i18n EN/ES)

**Files:**
- Create: `messages/en.json`
- Create: `messages/es.json`
- Create: `shared/lib/i18n.ts`
- Modify: `next.config.ts`
- Create: `app/i18n/request.ts` (o `i18n.ts` según la versión de next-intl)

**Step 1: Revisar versión de next-intl instalada**

```bash
cat node_modules/next-intl/package.json | grep '"version"'
```

**Step 2: Crear directorio de mensajes**

```bash
mkdir -p messages
```

**Step 3: Crear `messages/en.json`** — Solo las claves base del Sprint 1

```json
{
  "app": {
    "name": "Things Review",
    "tagline": "Review the things you love, together."
  },
  "nav": {
    "movies": "Movies",
    "series": "Series",
    "reviews": "My Reviews",
    "groups": "Groups",
    "profile": "Profile"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong",
    "noResults": "No results found",
    "required": "This field is required"
  },
  "contentType": {
    "movie": "Movie",
    "series": "Series",
    "music": "Music",
    "game": "Game",
    "book": "Book",
    "podcast": "Podcast"
  },
  "status": {
    "consumed": {
      "movie": "Watched",
      "series": "Watched",
      "music": "Listened",
      "game": "Played",
      "book": "Read",
      "podcast": "Listened"
    },
    "want_to_consume": {
      "movie": "Want to Watch",
      "series": "Want to Watch",
      "music": "Want to Listen",
      "game": "Want to Play",
      "book": "Want to Read",
      "podcast": "Want to Listen"
    },
    "consuming": {
      "movie": "Watching",
      "series": "Watching",
      "music": "Listening",
      "game": "Playing",
      "book": "Reading",
      "podcast": "Listening"
    },
    "dropped": {
      "movie": "Dropped",
      "series": "Dropped",
      "music": "Dropped",
      "game": "Dropped",
      "book": "Dropped",
      "podcast": "Dropped"
    }
  }
}
```

**Step 4: Crear `messages/es.json`**

```json
{
  "app": {
    "name": "Things Review",
    "tagline": "Reviewá las cosas que amás, en grupo."
  },
  "nav": {
    "movies": "Películas",
    "series": "Series",
    "reviews": "Mis Reviews",
    "groups": "Grupos",
    "profile": "Perfil"
  },
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando...",
    "error": "Algo salió mal",
    "noResults": "No se encontraron resultados",
    "required": "Este campo es requerido"
  },
  "contentType": {
    "movie": "Película",
    "series": "Serie",
    "music": "Música",
    "game": "Videojuego",
    "book": "Libro",
    "podcast": "Podcast"
  },
  "status": {
    "consumed": {
      "movie": "Vista",
      "series": "Vista",
      "music": "Escuchado",
      "game": "Jugado",
      "book": "Leído",
      "podcast": "Escuchado"
    },
    "want_to_consume": {
      "movie": "Quiero verla",
      "series": "Quiero verla",
      "music": "Quiero escucharlo",
      "game": "Quiero jugarlo",
      "book": "Quiero leerlo",
      "podcast": "Quiero escucharlo"
    },
    "consuming": {
      "movie": "Viendo",
      "series": "Viendo",
      "music": "Escuchando",
      "game": "Jugando",
      "book": "Leyendo",
      "podcast": "Escuchando"
    },
    "dropped": {
      "movie": "Abandonada",
      "series": "Abandonada",
      "music": "Abandonado",
      "game": "Abandonado",
      "book": "Abandonado",
      "podcast": "Abandonado"
    }
  }
}
```

**Step 5: Configurar next-intl**

Seguir la documentación oficial de next-intl según la versión instalada. En general para Next.js App Router:

Crear `i18n/request.ts` (o el path que pida la versión):
```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}))
```

Modificar `next.config.ts`:
```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl({
  // existing config...
})
```

> **IMPORTANTE:** Verificar en `node_modules/next-intl/dist/docs/` o README de next-intl la configuración exacta para la versión instalada. La API puede variar.

**Step 6: Verificar TypeScript (puede haber errores de tipos de next-intl)**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit 2>&1 | head -20
```

**Step 7: Commit**

```bash
git add messages/ i18n/ next.config.ts app/
git commit -m "feat: setup next-intl i18n with EN/ES messages"
```

---

## Task 10: Hooks genéricos (shared/hooks)

**Files:**
- Create: `shared/hooks/useLocalStorage.ts`
- Create: `shared/hooks/useMediaQuery.ts`
- Create: `shared/hooks/index.ts`

**Step 1: Crear `shared/hooks/useLocalStorage.ts`**

```typescript
// shared/hooks/useLocalStorage.ts
'use client'

import { useState, useCallback } from 'react'
import { getFromStorage, setToStorage } from '@/shared/services/localStorage.service'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() =>
    getFromStorage<T>(key, initialValue)
  )

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
      setToStorage(key, next)
      return next
    })
  }, [key])

  return [storedValue, setValue] as const
}
```

**Step 2: Crear `shared/hooks/useMediaQuery.ts`**

```typescript
// shared/hooks/useMediaQuery.ts
'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar media queries.
 * Uso: useMediaQuery('(min-width: 768px)') o useMediaQuery('min-md')
 * Shorthand: 'min-md' → '(min-width: 768px)', 'max-md' → '(max-width: 767px)'
 */
const SHORTHANDS: Record<string, string> = {
  'min-sm':  '(min-width: 640px)',
  'max-sm':  '(max-width: 639px)',
  'min-md':  '(min-width: 768px)',
  'max-md':  '(max-width: 767px)',
  'min-lg':  '(min-width: 1024px)',
  'max-lg':  '(max-width: 1023px)',
  'min-xl':  '(min-width: 1280px)',
  'max-xl':  '(max-width: 1279px)',
}

export function useMediaQuery(query: string): boolean {
  const resolvedQuery = SHORTHANDS[query] ?? query

  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(resolvedQuery)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [resolvedQuery])

  return matches
}
```

**Step 3: Crear `shared/hooks/index.ts`**

```typescript
// shared/hooks/index.ts
export { useLocalStorage } from './useLocalStorage'
export { useMediaQuery } from './useMediaQuery'
```

**Step 4: Verificar TypeScript**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add shared/hooks/
git commit -m "feat: add useLocalStorage and useMediaQuery hooks"
```

---

## Task 11: Verificación final del Sprint 1

**Step 1: Verificar estructura completa**

```bash
find shared entities features -type f | sort
```

Expected: Ver todos los archivos creados en las tasks anteriores.

**Step 2: Verificar TypeScript limpio**

```bash
cd /home/rrodriguez/richard/things-review && npx tsc --noEmit
```

Expected: 0 errores.

**Step 3: Verificar que el dev server arranca**

```bash
cd /home/rrodriguez/richard/things-review && timeout 15 bun run dev 2>&1 | head -20
```

Expected: Ver "Ready" sin errores de compilación.

**Step 4: Commit final de cierre del sprint si hay algo pendiente**

```bash
git add -A
git status
```

Si hay archivos no commiteados:
```bash
git commit -m "chore: sprint 1 foundations complete"
```

---

## Resumen del Sprint 1

Al finalizar este plan, el proyecto tendrá:

| Capa | Archivos creados |
|------|-----------------|
| `shared/types/` | Todos los tipos base: ContentType, Rating, ConsumptionStatus, ReviewableItem, etc. |
| `shared/schemas/` | Schemas Zod base reutilizables |
| `shared/constants/` | ROUTES, STORAGE_KEYS, QUERY_CONFIG |
| `shared/utils/` | cn, formatDate, generateId, generateInviteCode, average |
| `shared/hooks/` | useLocalStorage, useMediaQuery |
| `shared/services/` | IUserService, IReviewService, IGroupService + implementaciones localStorage |
| `shared/lib/store/` | Zustand + Immer: user, reviews, groups, ui slices |
| `shared/lib/query-client.ts` | TanStack Query setup |
| `entities/*/types.ts` | User, Movie, Series, Review, Group, Comment, Game |
| `entities/*/schema.ts` | Schemas Zod por entidad |
| `app/providers.tsx` | QueryClientProvider |
| `messages/en.json` | Traducciones EN |
| `messages/es.json` | Traducciones ES |

**El Sprint 2 puede arrancar directamente** con el formulario de onboarding (crear perfil), ya que toda la infraestructura está lista.
