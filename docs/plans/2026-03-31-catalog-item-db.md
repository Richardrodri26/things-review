# CatalogItem DB — Implementation Plan

> **For agentic workers:** Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover el catálogo de contenido de localStorage a la base de datos para que todos los usuarios compartan los mismos IDs estables, y las reviews muestren título e imagen correctamente independientemente de quién las creó.

**Architecture:** Se crea una tabla `CatalogItem` en Postgres con los datos mock actuales como seed. El campo `catalogItemId` (nullable FK) se agrega a `Review` y se resuelve automáticamente en el backend cuando el `contentId` coincide con un item de la DB. Los GET de reviews incluyen `catalogItem` en el response. ReviewCard prefiere los datos del server sobre el catálogo local.

**Tech Stack:** Prisma 7, Next.js App Router Route Handlers, TanStack Query, TypeScript

---

## Mapa de archivos

| Archivo | Acción | Qué hace |
|---|---|---|
| `prisma/schema.prisma` | Modificar | Agrega `CatalogItem` + `catalogItemId` nullable en `Review` |
| `prisma/seed.ts` | Crear | Inserta todos los MOCK_* como `CatalogItem` en la DB |
| `package.json` | Modificar | Agrega script seed y config `prisma.seed` |
| `src/app/api/catalog/items/route.ts` | Crear | `GET /api/catalog/items?type=movie` desde DB |
| `src/shared/services/api/catalog.service.ts` | Crear | `ApiCatalogService` que consume la API |
| `src/shared/services/index.ts` | Modificar | Swap `LocalCatalogService` → `ApiCatalogService` |
| `src/app/api/reviews/route.ts` | Modificar | POST auto-resuelve `catalogItemId`; GET incluye `catalogItem` |
| `src/app/api/reviews/[id]/route.ts` | Modificar | GET y PATCH incluyen `catalogItem` |
| `src/app/api/reviews/by-content/route.ts` | Modificar | GET incluye `catalogItem` |
| `src/app/api/groups/[id]/reviews/route.ts` | Modificar | GET incluye `catalogItem` |
| `src/entities/review/types.ts` | Modificar | Agrega `catalogItem?` a `Review` y `ReviewWithUser` |
| `src/features/reviews/components/ReviewCard.tsx` | Modificar | Prefiere `review.catalogItem` sobre lookup local |

---

## Task 1: Schema — CatalogItem + catalogItemId en Review

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Agregar modelo `CatalogItem` y FK nullable en `Review`**

```prisma
// Al final de schema.prisma, antes del cierre

model CatalogItem {
  id               String   @id @default(uuid())
  contentType      String
  title            String
  coverImageUrl    String?
  backdropImageUrl String?
  year             Int?
  metadata         Json?
  externalId       String?
  provider         String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  reviews Review[]

  @@unique([externalId, provider])
}
```

En el modelo `Review`, agregar después de `metadata Json?`:

```prisma
  catalogItemId    String?
  catalogItem      CatalogItem? @relation(fields: [catalogItemId], references: [id], onDelete: SetNull)
```

- [ ] **Generar y aplicar la migración**

```bash
npx prisma migrate dev --name add_catalog_item
```

Verificar que la migración se creó en `prisma/migrations/`.

- [ ] **Regenerar el Prisma Client**

```bash
npx prisma generate
```

---

## Task 2: Seed — insertar mock data en CatalogItem

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Crear `prisma/seed.ts`**

```ts
import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const SEED_ITEMS: Array<{
  contentType: string
  title: string
  coverImageUrl?: string
  backdropImageUrl?: string
  year?: number
  metadata?: Record<string, unknown>
}> = [
  // ── Movies ──────────────────────────────────────────────
  {
    contentType: 'movie',
    title: 'Inception',
    year: 2010,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    metadata: { runtime: 148, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'The Dark Knight',
    year: 2008,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsNprs3Dg.jpg',
    metadata: { runtime: 152, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Interstellar',
    year: 2014,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    metadata: { runtime: 169, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Pulp Fiction',
    year: 1994,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    metadata: { runtime: 154, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'The Matrix',
    year: 1999,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fFexlkjJxs29MzKJo9mY9RWLLVS.jpg',
    metadata: { runtime: 136, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Parasite',
    year: 2019,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    metadata: { runtime: 132, originalLanguage: 'ko' },
  },
  {
    contentType: 'movie',
    title: 'Everything Everywhere All at Once',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/fFexlkjJxs29MzKJo9mY9RWLLVS.jpg',
    metadata: { runtime: 139, originalLanguage: 'en' },
  },
  {
    contentType: 'movie',
    title: 'Dune: Part One',
    year: 2021,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklpcvwE3HP2SmWeqwwVsW.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
    metadata: { runtime: 155, originalLanguage: 'en' },
  },
  // ── Series ──────────────────────────────────────────────
  {
    contentType: 'series',
    title: 'Breaking Bad',
    year: 2008,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    metadata: { numberOfSeasons: 5, numberOfEpisodes: 62, status: 'ended' },
  },
  {
    contentType: 'series',
    title: 'Succession',
    year: 2018,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/e2X8NpiN9sMoqnZKBNhS7bGFSBc.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/1Fh8jLGMiPRlsJVa9GEdnFMURZb.jpg',
    metadata: { numberOfSeasons: 4, numberOfEpisodes: 39, status: 'ended' },
  },
  {
    contentType: 'series',
    title: 'The Bear',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/xNi4KKMRR79LPnQS3PjBkqt9Fdt.jpg',
    metadata: { numberOfSeasons: 3, status: 'returning' },
  },
  {
    contentType: 'series',
    title: 'Severance',
    year: 2022,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/oFRFm77LHWaUCQ8V9sRc7R4AQEP.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/3pTwMUEavTzVOh9yFCPqvhJfUOG.jpg',
    metadata: { numberOfSeasons: 2, status: 'returning' },
  },
  {
    contentType: 'series',
    title: 'The Last of Us',
    year: 2023,
    coverImageUrl: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    backdropImageUrl: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95iiG8ffnW.jpg',
    metadata: { numberOfSeasons: 2, status: 'returning' },
  },
  // ── Music ───────────────────────────────────────────────
  {
    contentType: 'music',
    title: 'To Pimp a Butterfly',
    year: 2015,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png',
    metadata: { artist: 'Kendrick Lamar', totalTracks: 16 },
  },
  {
    contentType: 'music',
    title: 'OK Computer',
    year: 1997,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png',
    metadata: { artist: 'Radiohead', totalTracks: 12 },
  },
  {
    contentType: 'music',
    title: 'Blonde',
    year: 2016,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a0/Frank_Ocean_-_Blonde.png',
    metadata: { artist: 'Frank Ocean', totalTracks: 17 },
  },
  {
    contentType: 'music',
    title: 'Random Access Memories',
    year: 2013,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
    metadata: { artist: 'Daft Punk', totalTracks: 13 },
  },
  // ── Games ───────────────────────────────────────────────
  {
    contentType: 'game',
    title: 'The Last of Us Part I',
    year: 2022,
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
    metadata: { developer: 'Naughty Dog' },
  },
  {
    contentType: 'game',
    title: 'Elden Ring',
    year: 2022,
    coverImageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png',
    metadata: { developer: 'FromSoftware' },
  },
  {
    contentType: 'game',
    title: 'Disco Elysium',
    year: 2019,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Disco_Elysium_cover_art.jpg',
    metadata: { developer: 'ZA/UM' },
  },
  {
    contentType: 'game',
    title: 'Hollow Knight',
    year: 2017,
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Hollow_Knight.png',
    metadata: { developer: 'Team Cherry' },
  },
  // ── Books ───────────────────────────────────────────────
  {
    contentType: 'book',
    title: 'The Name of the Wind',
    year: 2007,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1270352123i/186074.jpg',
    metadata: { author: ['Patrick Rothfuss'], pageCount: 662 },
  },
  {
    contentType: 'book',
    title: 'Dune',
    year: 1965,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
    metadata: { author: ['Frank Herbert'], pageCount: 412 },
  },
  {
    contentType: 'book',
    title: 'The Pragmatic Programmer',
    year: 1999,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg',
    metadata: { author: ['David Thomas', 'Andrew Hunt'], pageCount: 352 },
  },
  {
    contentType: 'book',
    title: '100 años de soledad',
    year: 1967,
    coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327881361i/320.jpg',
    metadata: { author: ['Gabriel García Márquez'], pageCount: 417 },
  },
  // ── Podcasts ────────────────────────────────────────────
  {
    contentType: 'podcast',
    title: 'Lex Fridman Podcast',
    year: 2018,
    metadata: { host: ['Lex Fridman'], isActive: true },
  },
  {
    contentType: 'podcast',
    title: 'Syntax',
    year: 2017,
    metadata: { host: ['Wes Bos', 'Scott Tolinski'], isActive: true },
  },
  {
    contentType: 'podcast',
    title: 'Darknet Diaries',
    year: 2017,
    metadata: { host: ['Jack Rhysider'], isActive: true },
  },
]

async function main() {
  console.log('Seeding CatalogItem...')

  for (const item of SEED_ITEMS) {
    await prisma.catalogItem.upsert({
      where: {
        // No externalId — usamos title+contentType como clave de upsert
        // Como no hay unique en esos campos, hacemos findFirst + create
        // El upsert usa externalId+provider como unique — para seed usamos un valor artificial
        externalId_provider: {
          externalId: `seed:${item.contentType}:${item.title.toLowerCase().replace(/\s+/g, '-')}`,
          provider: 'seed',
        },
      },
      update: {
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        backdropImageUrl: item.backdropImageUrl,
        year: item.year,
        metadata: item.metadata as object,
      },
      create: {
        contentType: item.contentType,
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        backdropImageUrl: item.backdropImageUrl,
        year: item.year,
        metadata: item.metadata as object,
        externalId: `seed:${item.contentType}:${item.title.toLowerCase().replace(/\s+/g, '-')}`,
        provider: 'seed',
      },
    })
  }

  console.log(`Seeded ${SEED_ITEMS.length} catalog items.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Agregar script seed en `package.json`**

Agregar dentro de `"scripts"`:
```json
"db:seed": "tsx prisma/seed.ts"
```

Agregar al nivel raíz (junto a `"scripts"`, `"dependencies"`, etc.):
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Verificar que `tsx` está instalado**

```bash
npx tsx --version
```

Si falla, instalar: `npm install --save-dev tsx`

- [ ] **Ejecutar el seed contra la DB local**

```bash
npm run db:seed
```

Salida esperada:
```
Seeding CatalogItem...
Seeded 27 catalog items.
```

---

## Task 3: API endpoint — GET /api/catalog/items

**Files:**
- Create: `src/app/api/catalog/items/route.ts`

- [ ] **Crear la carpeta y el route**

```ts
// src/app/api/catalog/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  const where = type ? { contentType: type } : {}

  const items = await prisma.catalogItem.findMany({
    where,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      contentType: true,
      title: true,
      coverImageUrl: true,
      backdropImageUrl: true,
      year: true,
      metadata: true,
    },
  })

  return NextResponse.json(items)
}
```

- [ ] **Verificar en el browser**

Iniciar dev server y navegar a:
`http://localhost:3000/api/catalog/items?type=movie`

Debe retornar JSON con los 8 movies. Si retorna 401, asegurarse de estar autenticado.

---

## Task 4: ApiCatalogService + swap en services/index.ts

**Files:**
- Create: `src/shared/services/api/catalog.service.ts`
- Modify: `src/shared/services/index.ts`

- [ ] **Crear `ApiCatalogService`**

```ts
// src/shared/services/api/catalog.service.ts
import type { ICatalogService, CatalogItem } from '../catalog.service'
import { apiGet } from './api-client'

// Shape que retorna el API (subconjunto flat de CatalogItem)
interface CatalogItemRecord {
  id: string
  contentType: string
  title: string
  coverImageUrl: string | null
  backdropImageUrl: string | null
  year: number | null
  metadata: Record<string, unknown> | null
}

function toAppItem(record: CatalogItemRecord): CatalogItem {
  // Cast seguro: el picker solo usa id, title, coverImageUrl, year, contentType
  return {
    id: record.id,
    contentType: record.contentType,
    title: record.title,
    coverImageUrl: record.coverImageUrl ?? undefined,
    backdropImageUrl: record.backdropImageUrl ?? undefined,
    year: record.year ?? undefined,
    createdAt: new Date(),
    providerId: 'db',
    // Spread metadata como campos extra del tipo concreto
    ...(record.metadata ?? {}),
  } as unknown as CatalogItem
}

export class ApiCatalogService implements ICatalogService {
  async getByType(contentType: CatalogItem['contentType']): Promise<CatalogItem[]> {
    const records = await apiGet<CatalogItemRecord[]>('/catalog/items', { type: contentType })
    return records.map(toAppItem)
  }

  async getMovies() { return this.getByType('movie') as ReturnType<ICatalogService['getMovies']> }
  async getMovieById(id: string) {
    const all = await this.getByType('movie')
    return (all.find((m) => m.id === id) ?? null) as ReturnType<ICatalogService['getMovieById']>
  }

  async getSeries() { return this.getByType('series') as ReturnType<ICatalogService['getSeries']> }
  async getSeriesById(id: string) {
    const all = await this.getByType('series')
    return (all.find((s) => s.id === id) ?? null) as ReturnType<ICatalogService['getSeriesById']>
  }

  async getMusic() { return this.getByType('music') as ReturnType<ICatalogService['getMusic']> }
  async getGames() { return this.getByType('game') as ReturnType<ICatalogService['getGames']> }
  async getBooks() { return this.getByType('book') as ReturnType<ICatalogService['getBooks']> }
  async getPodcasts() { return this.getByType('podcast') as ReturnType<ICatalogService['getPodcasts']> }

  async search(query: string): Promise<CatalogItem[]> {
    const types: CatalogItem['contentType'][] = ['movie', 'series', 'music', 'game', 'book', 'podcast']
    const all = (await Promise.all(types.map((t) => this.getByType(t)))).flat()
    const q = query.toLowerCase()
    return all.filter((item) => item.title.toLowerCase().includes(q))
  }

  async addItem(): Promise<CatalogItem> {
    throw new Error('Adding catalog items directly is not supported. Use the admin panel.')
  }
}
```

- [ ] **Actualizar `services/index.ts`**

Reemplazar:
```ts
import { LocalCatalogService } from './catalog.service'
```
Con:
```ts
import { ApiCatalogService } from './api/catalog.service'
```

Y reemplazar:
```ts
  catalog: new LocalCatalogService(),
```
Con:
```ts
  catalog: new ApiCatalogService(),
```

- [ ] **Verificar en el browser**

Navegar a la página de reviews y abrir el ContentPicker. Debe cargar los items desde la API (no localStorage). Verificar en Network tab que hay un request a `/api/catalog/items?type=movie`.

---

## Task 5: Review POST — auto-resolver catalogItemId

**Files:**
- Modify: `src/app/api/reviews/route.ts`

- [ ] **Actualizar el POST para resolver `catalogItemId` y el GET para incluir `catalogItem`**

```ts
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { createReviewDTOSchema } from '@/entities/review/schema'

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const contentType = searchParams.get('contentType')
  const status = searchParams.get('status')

  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
      ...(contentType && { contentType }),
      ...(status && { status }),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = await req.json()
  const parsed = createReviewDTOSchema.safeParse({ ...body, userId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { userId, contentId, contentType, rating, title, body: reviewBody,
    containsSpoilers, status: reviewStatus, metadata, consumedAt } = parsed.data

  if (reviewStatus === 'want_to_consume') {
    return NextResponse.json(
      { error: 'A review cannot have status "want_to_consume". Use consumed, consuming, or dropped.' },
      { status: 422 }
    )
  }

  // Auto-resolver catalogItemId si el contentId corresponde a un CatalogItem en DB
  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: contentId } })

  const review = await prisma.review.create({
    data: {
      userId,
      contentId,
      contentType,
      rating,
      title,
      body: reviewBody as object,
      containsSpoilers,
      status: reviewStatus,
      metadata: metadata as object,
      consumedAt,
      ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  return NextResponse.json(review, { status: 201 })
}
```

---

## Task 6: Review GET endpoints — incluir catalogItem

**Files:**
- Modify: `src/app/api/reviews/[id]/route.ts`
- Modify: `src/app/api/reviews/by-content/route.ts`
- Modify: `src/app/api/groups/[id]/reviews/route.ts`

- [ ] **Actualizar `reviews/[id]/route.ts`**

Definir el selector al inicio del archivo (después de los imports):

```ts
const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const
```

En `GET`: reemplazar `prisma.review.findUnique({ where: { id } })` con:
```ts
const review = await prisma.review.findUnique({
  where: { id },
  include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
})
```

En `PATCH`: agregar `include: { catalogItem: { select: CATALOG_ITEM_SELECT } }` al `prisma.review.update`.

- [ ] **Actualizar `reviews/by-content/route.ts`**

Agregar el selector `CATALOG_ITEM_SELECT` (mismo objeto de arriba).

En `prisma.review.findMany`, agregar `catalogItem: { select: CATALOG_ITEM_SELECT }` dentro del `include` en ambas ramas del ternario:

```ts
  include: groupId
    ? {
        user: { select: { id: true, username: true, displayName: true, image: true } },
        catalogItem: { select: CATALOG_ITEM_SELECT },
        comments: {
          where: { groupId },
          include: {
            author: { select: { id: true, username: true, displayName: true, image: true } },
          },
        },
      }
    : {
        user: { select: { id: true, username: true, displayName: true, image: true } },
        catalogItem: { select: CATALOG_ITEM_SELECT },
      },
```

- [ ] **Actualizar `groups/[id]/reviews/route.ts`**

Agregar el selector `CATALOG_ITEM_SELECT`.

En `prisma.review.findMany`:
```ts
    include: {
      user: { select: { id: true, username: true, displayName: true, image: true } },
      catalogItem: { select: CATALOG_ITEM_SELECT },
    },
```

En el `map` final, propagar `catalogItem`:
```ts
  const mapped = reviews.map(({ user, catalogItem, ...review }) => ({
    ...review,
    catalogItem: catalogItem ?? null,
    user: {
      id: user.id,
      username: user.username ?? '',
      displayName: user.displayName ?? user.username ?? '',
      avatarUrl: user.image ?? undefined,
    },
  }))
```

---

## Task 7: Review types — agregar catalogItem

**Files:**
- Modify: `src/entities/review/types.ts`

- [ ] **Agregar `CatalogItemSnapshot` y campo `catalogItem` en `Review`**

```ts
// Agregar antes de la interfaz Review
export interface CatalogItemSnapshot {
  id: string
  title: string
  coverImageUrl: string | null
  backdropImageUrl: string | null
  contentType: string
  year: number | null
}

// En la interfaz Review, agregar:
  catalogItem?: CatalogItemSnapshot | null
```

`ReviewWithUser` hereda de `Review`, por lo que automáticamente también lo tiene.

---

## Task 8: ReviewCard — preferir catalogItem del servidor

**Files:**
- Modify: `src/features/reviews/components/ReviewCard.tsx`

- [ ] **Actualizar ReviewCard para usar `review.catalogItem` cuando existe**

Reemplazar las líneas actuales:
```ts
const catalogItem = useCatalogItem(review.contentType, review.contentId)
const itemTitle = useCatalogItemTitle(review.contentId, review.contentType)
```

Con:
```ts
const localCatalogItem = useCatalogItem(review.contentType, review.contentId)
const resolvedItem = review.catalogItem ?? localCatalogItem
const itemTitle = resolvedItem?.title ?? review.contentId
```

Reemplazar todas las referencias a `catalogItem` (variable local) con `resolvedItem`:
- `catalogItem?.coverImageUrl` → `resolvedItem?.coverImageUrl`

La línea que usa `itemTitle` directamente ya queda correcta.

- [ ] **Verificar en la UI**

Crear una review nueva desde la UI. Verificar que:
1. El ContentPicker muestra los items del catálogo
2. Al guardar, la review muestra el título correcto
3. Si otro usuario (u otra sesión) ve la misma review, también muestra el título e imagen correctamente (porque viene del `include: { catalogItem }`)

---

## Task 9: Producción — migrar Neon

- [ ] **Ejecutar la migración en producción**

Con las credenciales de Neon en las env vars de producción:

```bash
DATABASE_URL="<neon-production-url>" npx prisma migrate deploy
```

- [ ] **Ejecutar el seed en producción**

```bash
DATABASE_URL="<neon-production-url>" npm run db:seed
```

Verificar que retorna `Seeded 27 catalog items.`

- [ ] **Deploy**

```bash
vercel --prod
```

O via push a main si está configurado el CI.
