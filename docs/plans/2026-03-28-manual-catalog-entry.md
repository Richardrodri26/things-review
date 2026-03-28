# Manual Catalog Entry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to manually add any reviewable item (movie, series, game, book, music, podcast) to the catalog so that reviews can be created for it.

**Architecture:** Extend `ICatalogService` with a generic `addItem` method keyed by `ContentType`, implement it in `LocalCatalogService` persisting to the correct localStorage cache key per type, expose a `useAddCatalogItem` mutation hook (TanStack Query), and build a single `AddContentForm` + `AddContentDialog` that renders shared base fields plus conditional type-specific fields — all driven by the existing `CONTENT_TYPE_LABELS` constants and Zod schemas. No third-party providers; `providerId` is always `'manual'`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, TanStack Query v5, TanStack Form, Zod 4, shadcn/ui (Dialog, Select, Input, Textarea, Label, Button, Switch).

---

## Task 1: Extend the catalog service interface and implementation

**Files:**
- Modify: `src/shared/services/catalog.service.ts`
- Modify: `src/shared/services/index.ts` (re-export the new DTO type)

### Context

The current `ICatalogService` only reads. We need a single `addItem` method that accepts a discriminated union DTO and persists to the right storage key. The `LocalCatalogService` already has `readMovies()` / `readSeries()` private helpers — we extend the same pattern for every other type.

**Key design decisions:**
- The method signature is generic on `ContentType` so callers get back the correct concrete type.
- `providerId` is always `'manual'`; `externalId` is always `undefined`.
- For types not yet seeded (music, game, book, podcast) the list simply starts empty.

### Step 1: Add missing entity types

The entities `music`, `book`, `podcast` may lack `types.ts`. Check and create them if missing.

`src/entities/music/types.ts`:
```typescript
// entities/music/types.ts
import type { ReviewableItem } from '@/shared/types'

export type MusicAlbumType = 'album' | 'ep' | 'single' | 'compilation'

export interface MusicAlbum extends ReviewableItem {
  contentType: 'music'
  artist: string
  albumType: MusicAlbumType
  totalTracks: number
  durationMs?: number
  label?: string
}
```

`src/entities/book/types.ts`:
```typescript
// entities/book/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Book extends ReviewableItem {
  contentType: 'book'
  author: string[]
  isbn?: string
  pageCount?: number
  publisher?: string
  language: string
}
```

`src/entities/podcast/types.ts`:
```typescript
// entities/podcast/types.ts
import type { ReviewableItem } from '@/shared/types'

export interface Podcast extends ReviewableItem {
  contentType: 'podcast'
  host: string[]
  totalEpisodes?: number
  language: string
  isActive: boolean
}
```

### Step 2: Add `addItem` to `ICatalogService` and implement it

Replace the interface and add the implementation in `src/shared/services/catalog.service.ts`.

At the **top of the file**, add the new imports:
```typescript
import type { MusicAlbum } from '@/entities/music/types'
import type { Game } from '@/entities/game/types'
import type { Book } from '@/entities/book/types'
import type { Podcast } from '@/entities/podcast/types'
```

Update `CatalogItem` union:
```typescript
export type CatalogItem = Movie | Series | MusicAlbum | Game | Book | Podcast
```

Add the DTO type (after `CatalogItem`):
```typescript
export type AddItemDTO =
  | Omit<Movie,       'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Series,      'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<MusicAlbum,  'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Game,        'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Book,        'id' | 'createdAt' | 'providerId' | 'externalId'>
  | Omit<Podcast,     'id' | 'createdAt' | 'providerId' | 'externalId'>
```

Add to `ICatalogService` interface:
```typescript
addItem(data: AddItemDTO): Promise<CatalogItem>
```

Implement in `LocalCatalogService` — add private read/write helpers for each new type and the `addItem` method:

```typescript
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
```

### Step 3: Re-export `AddItemDTO` from the services index

In `src/shared/services/index.ts`, add to the existing re-exports:
```typescript
export type { ICatalogService, CatalogItem, AddItemDTO } from './catalog.service'
```

### Step 4: Verify TypeScript compiles

```bash
npx tsc --noEmit
```
Expected: no errors related to `catalog.service.ts`.

---

## Task 2: Add the `useAddCatalogItem` mutation hook

**Files:**
- Modify: `src/features/catalog/hooks/useCatalog.ts`
- Modify: `src/features/catalog/hooks/index.ts`

### Context

TanStack Query mutations must invalidate the correct query key. Since `addItem` is generic, we inspect `contentType` from the returned item and invalidate either `MOVIES_QUERY_KEY` or `SERIES_QUERY_KEY`. For future types (music, game, book, podcast) the keys don't exist yet — we'll define them here.

### Step 1: Add the new query keys and the mutation hook

Add at the top of `useCatalog.ts` (after existing query keys):
```typescript
export const MUSIC_QUERY_KEY  = ['catalog', 'music']  as const
export const GAMES_QUERY_KEY  = ['catalog', 'games']  as const
export const BOOKS_QUERY_KEY  = ['catalog', 'books']  as const
export const PODCASTS_QUERY_KEY = ['catalog', 'podcasts'] as const
```

Add the helper map (after the query keys):
```typescript
const CONTENT_TYPE_QUERY_KEY: Record<string, readonly string[]> = {
  movie:   MOVIES_QUERY_KEY,
  series:  SERIES_QUERY_KEY,
  music:   MUSIC_QUERY_KEY,
  game:    GAMES_QUERY_KEY,
  book:    BOOKS_QUERY_KEY,
  podcast: PODCASTS_QUERY_KEY,
}
```

Add the new imports at the top of the file:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AddItemDTO } from '@/shared/services'
```

Add the mutation hook at the end of the file:
```typescript
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
```

### Step 2: Export from index

In `src/features/catalog/hooks/index.ts`, add:
```typescript
export { useAddCatalogItem } from './useCatalog'
```

### Step 3: Verify TypeScript

```bash
npx tsc --noEmit
```
Expected: no errors.

---

## Task 3: Build the `AddContentForm` component

**Files:**
- Create: `src/features/catalog/components/AddContentForm.tsx`

### Context

This is the most complex piece. The form has two sections:

**Section A — Base fields** (every type has these, from `ReviewableItem`):
- `contentType` — Select (shown first, drives the conditional fields)
- `title` — Input (required)
- `year` — Input number (required, 1888–2100)
- `overview` — Textarea (optional)
- `coverImageUrl` — Input url (optional)

**Section B — Type-specific fields** (rendered conditionally based on `contentType`):

| contentType | Extra fields |
|-------------|-------------|
| `movie`     | `originalLanguage` (Input, 2-char), `runtime` (Input number, optional), `releaseDate` (Input date, required) |
| `series`    | `originalLanguage`, `firstAirDate` (required), `numberOfSeasons` (required), `numberOfEpisodes` (required), `status` (Select: returning_series / ended / canceled / in_production / planned) |
| `music`     | `artist` (required), `albumType` (Select: album/ep/single/compilation), `totalTracks` (required) |
| `game`      | `platforms` (multi-select via checkboxes), `developer` (optional) |
| `book`      | `author` comma-separated string → split to array (required), `language` (required), `pageCount` (optional) |
| `podcast`   | `host` comma-separated string → split to array (required), `language` (required), `isActive` (Switch/checkbox) |

### Step 1: Create the Zod schema

```typescript
// Base schema shared by all types
const baseSchema = z.object({
  title:        z.string().min(1, 'Title is required'),
  year:         z.coerce.number().int().min(1888).max(2100),
  overview:     z.string().optional(),
  coverImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

// Discriminated union by contentType
const addContentSchema = z.discriminatedUnion('contentType', [
  baseSchema.extend({
    contentType:      z.literal('movie'),
    originalLanguage: z.string().length(2, 'Use 2-letter ISO code'),
    runtime:          z.coerce.number().int().positive().optional(),
    releaseDate:      z.string().min(1, 'Release date is required'),
  }),
  baseSchema.extend({
    contentType:        z.literal('series'),
    originalLanguage:   z.string().length(2, 'Use 2-letter ISO code'),
    firstAirDate:       z.string().min(1, 'First air date is required'),
    numberOfSeasons:    z.coerce.number().int().min(1),
    numberOfEpisodes:   z.coerce.number().int().min(1),
    status:             z.enum(['returning_series', 'ended', 'canceled', 'in_production', 'planned']),
  }),
  baseSchema.extend({
    contentType:  z.literal('music'),
    artist:       z.string().min(1, 'Artist is required'),
    albumType:    z.enum(['album', 'ep', 'single', 'compilation']),
    totalTracks:  z.coerce.number().int().min(1),
  }),
  baseSchema.extend({
    contentType: z.literal('game'),
    platforms:   z.array(z.enum(['pc','playstation_5','playstation_4','xbox_series','xbox_one','nintendo_switch','mobile','other'])).min(1, 'Select at least one platform'),
    developer:   z.string().optional(),
  }),
  baseSchema.extend({
    contentType: z.literal('book'),
    author:      z.string().min(1, 'Author is required'),   // comma-separated
    language:    z.string().length(2, 'Use 2-letter ISO code'),
    pageCount:   z.coerce.number().int().positive().optional(),
  }),
  baseSchema.extend({
    contentType:   z.literal('podcast'),
    host:          z.string().min(1, 'Host is required'),   // comma-separated
    language:      z.string().length(2, 'Use 2-letter ISO code'),
    isActive:      z.boolean(),
    totalEpisodes: z.coerce.number().int().positive().optional(),
  }),
])

type AddContentFormData = z.input<typeof addContentSchema>
```

### Step 2: Build the transform function

Before calling `addItem`, we need to convert the flat form data into the correct `AddItemDTO` shape (e.g., split comma-separated strings, strip empty `coverImageUrl`):

```typescript
function toAddItemDTO(values: AddContentFormData): AddItemDTO {
  const cover = values.coverImageUrl?.trim() || undefined

  switch (values.contentType) {
    case 'movie':
      return { ...values, coverImageUrl: cover, adult: false, genres: [] }
    case 'series':
      return { ...values, coverImageUrl: cover, adult: false, genres: [] }
    case 'music':
      return { ...values, coverImageUrl: cover, genres: [] }
    case 'game':
      return { ...values, coverImageUrl: cover, genres: [] }
    case 'book':
      return {
        ...values,
        coverImageUrl: cover,
        genres: [],
        author: values.author.split(',').map((s) => s.trim()).filter(Boolean),
      }
    case 'podcast':
      return {
        ...values,
        coverImageUrl: cover,
        genres: [],
        host: values.host.split(',').map((s) => s.trim()).filter(Boolean),
      }
  }
}
```

### Step 3: Write the full component

```typescript
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { useAddCatalogItem } from '../hooks'
import type { AddItemDTO, CatalogItem } from '@/shared/services'
import type { ContentType } from '@/shared/types'

// ... (schema + toAddItemDTO from above)

interface AddContentFormProps {
  defaultContentType?: ContentType
  onSuccess?: (item: CatalogItem) => void
  onCancel?: () => void
}

export function AddContentForm({ defaultContentType = 'movie', onSuccess, onCancel }: AddContentFormProps) {
  const addItem = useAddCatalogItem()

  const form = useForm({
    defaultValues: {
      contentType: defaultContentType,
      title: '',
      year: new Date().getFullYear(),
      overview: '',
      coverImageUrl: '',
      // movie
      originalLanguage: 'en',
      runtime: undefined,
      releaseDate: '',
      // series
      firstAirDate: '',
      numberOfSeasons: 1,
      numberOfEpisodes: 1,
      status: 'returning_series',
      // music
      artist: '',
      albumType: 'album',
      totalTracks: 1,
      // game
      platforms: [] as string[],
      developer: '',
      // book
      author: '',
      language: 'en',
      pageCount: undefined,
      // podcast
      host: '',
      isActive: true,
      totalEpisodes: undefined,
    } as AddContentFormData,
    onSubmit: async ({ value }) => {
      const dto = toAddItemDTO(value)
      const result = await addItem.mutateAsync(dto)
      onSuccess?.(result)
    },
  })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}
      className="space-y-4"
    >
      {/* Content Type selector */}
      <form.Field name="contentType">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as ContentType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, { en: string; icon: string }][]).map(
                  ([type, { en, icon }]) => (
                    <SelectItem key={type} value={type}>
                      {icon} {en}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Inception"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      {/* Year */}
      <form.Field name="year">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Year *</Label>
            <Input
              type="number"
              min={1888}
              max={2100}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      {/* Overview */}
      <form.Field name="overview">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Overview <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              placeholder="Short description..."
              rows={3}
              className="resize-none"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      {/* Cover Image URL */}
      <form.Field name="coverImageUrl">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Cover Image URL <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              type="url"
              placeholder="https://..."
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      {/* === TYPE-SPECIFIC FIELDS === */}
      <form.Subscribe selector={(s) => s.values.contentType}>
        {(contentType) => (
          <>
            {/* MOVIE */}
            {contentType === 'movie' && (
              <>
                <form.Field name="releaseDate">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Release Date *</Label>
                      <Input type="date" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="originalLanguage">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Language *</Label>
                        <Input placeholder="en" maxLength={2} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value.toLowerCase())} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="runtime">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Runtime (min) <span className="text-muted-foreground">(optional)</span></Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* SERIES */}
            {contentType === 'series' && (
              <>
                <form.Field name="firstAirDate">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>First Air Date *</Label>
                      <Input type="date" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="originalLanguage">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Language *</Label>
                      <Input placeholder="en" maxLength={2} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value.toLowerCase())} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="numberOfSeasons">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Seasons *</Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(Number(e.target.value))} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="numberOfEpisodes">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Episodes *</Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(Number(e.target.value))} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                </div>
                <form.Field name="status">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Status *</Label>
                      <Select value={field.state.value ?? ''} onValueChange={(v) => field.handleChange(v as typeof field.state.value)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="returning_series">Returning Series</SelectItem>
                          <SelectItem value="ended">Ended</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </>
            )}

            {/* MUSIC */}
            {contentType === 'music' && (
              <>
                <form.Field name="artist">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Artist *</Label>
                      <Input placeholder="e.g. Radiohead" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="albumType">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Type *</Label>
                        <Select value={field.state.value ?? 'album'} onValueChange={(v) => field.handleChange(v as typeof field.state.value)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="album">Album</SelectItem>
                            <SelectItem value="ep">EP</SelectItem>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="compilation">Compilation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="totalTracks">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Tracks *</Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(Number(e.target.value))} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* GAME */}
            {contentType === 'game' && (
              <>
                <form.Field name="developer">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Developer <span className="text-muted-foreground">(optional)</span></Label>
                      <Input placeholder="e.g. FromSoftware" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="platforms">
                  {(field) => {
                    const PLATFORMS = [
                      { value: 'pc', label: 'PC' },
                      { value: 'playstation_5', label: 'PS5' },
                      { value: 'playstation_4', label: 'PS4' },
                      { value: 'xbox_series', label: 'Xbox Series' },
                      { value: 'xbox_one', label: 'Xbox One' },
                      { value: 'nintendo_switch', label: 'Nintendo Switch' },
                      { value: 'mobile', label: 'Mobile' },
                      { value: 'other', label: 'Other' },
                    ]
                    const current = (field.state.value ?? []) as string[]
                    return (
                      <div className="space-y-1.5">
                        <Label>Platforms *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map((p) => (
                            <div key={p.value} className="flex items-center gap-2">
                              <Checkbox
                                id={`platform-${p.value}`}
                                checked={current.includes(p.value)}
                                onCheckedChange={(checked) => {
                                  field.handleChange(
                                    checked
                                      ? [...current, p.value]
                                      : current.filter((v) => v !== p.value)
                                  )
                                }}
                              />
                              <label htmlFor={`platform-${p.value}`} className="text-sm cursor-pointer">{p.label}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }}
                </form.Field>
              </>
            )}

            {/* BOOK */}
            {contentType === 'book' && (
              <>
                <form.Field name="author">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Author(s) * <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                      <Input placeholder="e.g. Frank Herbert" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="language">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Language *</Label>
                        <Input placeholder="en" maxLength={2} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value.toLowerCase())} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="pageCount">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Pages <span className="text-muted-foreground">(optional)</span></Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* PODCAST */}
            {contentType === 'podcast' && (
              <>
                <form.Field name="host">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Host(s) * <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                      <Input placeholder="e.g. Lex Fridman" value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="language">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Language *</Label>
                        <Input placeholder="en" maxLength={2} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value.toLowerCase())} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="totalEpisodes">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Episodes <span className="text-muted-foreground">(optional)</span></Label>
                        <Input type="number" min={1} value={field.state.value ?? ''} onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)} onBlur={field.handleBlur} />
                      </div>
                    )}
                  </form.Field>
                </div>
                <form.Field name="isActive">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isActive"
                        checked={field.state.value ?? true}
                        onCheckedChange={(v) => field.handleChange(Boolean(v))}
                      />
                      <label htmlFor="isActive" className="text-sm cursor-pointer">Still publishing episodes</label>
                    </div>
                  )}
                </form.Field>
              </>
            )}
          </>
        )}
      </form.Subscribe>

      {/* Actions */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add to Catalog'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
```

---

## Task 4: Build the `AddContentDialog` component

**Files:**
- Create: `src/features/catalog/components/AddContentDialog.tsx`
- Modify: `src/features/catalog/components/index.ts`

### Context

A wrapper Dialog that owns open state, renders a trigger button (`PlusIcon + "Add manually"`), and mounts `AddContentForm` inside. On success, closes automatically.

```typescript
'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AddContentForm } from './AddContentForm'
import type { ContentType } from '@/shared/types'

interface AddContentDialogProps {
  defaultContentType?: ContentType
}

export function AddContentDialog({ defaultContentType }: AddContentDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        Add manually
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Catalog</DialogTitle>
            <DialogDescription>
              Add a movie, series, game, book, album or podcast manually.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <AddContentForm
              defaultContentType={defaultContentType}
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
```

Export from `index.ts`:
```typescript
export { AddContentDialog } from './AddContentDialog'
export { AddContentForm } from './AddContentForm'
```

---

## Task 5: Integrate the dialog into `MoviesPage` and `SeriesPage`

**Files:**
- Modify: `src/features/catalog/components/MoviesPage.tsx`
- Modify: `src/features/catalog/components/SeriesPage.tsx`

### MoviesPage — add the button to the header

Replace the existing header section:
```tsx
<div className="flex items-center justify-between">
  <h1 className="text-xl font-semibold">Movies</h1>
  <div className="flex items-center gap-2">
    {!isLoading && (
      <span className="text-sm text-muted-foreground">{movies.length} titles</span>
    )}
    <AddContentDialog defaultContentType="movie" />
  </div>
</div>
```

Add to imports:
```typescript
import { AddContentDialog } from './AddContentDialog'
```

### SeriesPage — same pattern

```tsx
<div className="flex items-center justify-between">
  <h1 className="text-xl font-semibold">Series</h1>
  <div className="flex items-center gap-2">
    {!isLoading && (
      <span className="text-sm text-muted-foreground">{seriesList.length} titles</span>
    )}
    <AddContentDialog defaultContentType="series" />
  </div>
</div>
```

---

## Task 6: Verify the full flow

### Step 1: Check TypeScript
```bash
npx tsc --noEmit
```
Expected: 0 errors.

### Step 2: Manual smoke test
1. Navigate to `/movies`
2. Click "Add manually"
3. Type: select Movie, title "Test Movie", year 2024, release date 2024-01-01, language "en"
4. Click "Add to Catalog"
5. Dialog closes and the new card appears in the grid
6. Repeat for Series
7. Open DevTools → Application → localStorage → verify `things-review:cache:movies` contains the new entry with `providerId: "manual"`

### Step 3: Commit
```bash
git add -A
git commit -m "feat: add manual catalog entry for any content type"
```
