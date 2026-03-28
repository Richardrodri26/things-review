# Sprint 6 — Dashboard & Homepage Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el placeholder de la homepage con un dashboard real que muestre actividad reciente, estadísticas rápidas, accesos directos al catálogo y las últimas reviews del usuario — convirtiéndola en la pantalla central de la app.

**Architecture:** Feature-Sliced Design. Todo vive en `src/features/dashboard/`. El dashboard es puramente de lectura — consume datos ya existentes en el store Zustand (reviews, user) y el cache de TanStack Query (movies, series del catálogo). No requiere nuevos servicios ni storage keys. El `ReviewForm` ya existe con `initialValues` — se reutiliza para el CTA de "add review" en el dashboard. La homepage `src/app/(app)/page.tsx` se reemplaza por el componente `DashboardPage`.

**Tech Stack:** Next.js 16 App Router, shadcn/ui (Base UI / base-mira), Zustand 5 + Immer, TanStack Query v5, TypeScript strict, Tailwind 4. Package manager: `bun`.

---

## Contexto del proyecto

**Estado actual post-Sprint 5:**
- `src/app/(app)/page.tsx` — placeholder con "Sprint 2 — shell activo ✓"
- `src/features/catalog/` — movies y series con seed mock, hooks (`useMovies`, `useSeriesList`, `useCatalogItemTitle`)
- `src/features/reviews/` — ReviewCard, ReviewForm, ReviewList, hooks de mutations
- `src/features/profile/lib/computeUserStats.ts` — función pura que calcula stats desde reviews
- `src/shared/lib/store/index.ts` — `useUser()`, `useReviews()`, `useStore((s) => s.reviews)`
- `src/shared/ui/atoms/` — `StatsCard`, `EmptyState`, `RatingStars`, `ContentTypeBadge`, `StatusBadge`
- `src/shared/types/index.ts` — `CONTENT_TYPE_LABELS` con `{ en, es, icon }` por content type

**Servicios disponibles (`src/shared/services/`):**
- `services.catalog.getMovies()` → `Promise<Movie[]>`
- `services.catalog.getSeries()` → `Promise<Series[]>`
- `services.reviews.getAll()` → `Promise<Review[]>`

**Store Zustand (`src/shared/lib/store/index.ts`):**
- `useUser()` → selector del usuario actual
- `useReviews()` → selector de la lista de reviews en memoria
- `useStore((s) => s.reviews)` → acceso directo a reviews

**Query hooks del catálogo (`src/features/catalog/hooks/`):**
- `useMovies()` → `{ data: Movie[], isLoading }`
- `useSeriesList()` → `{ data: Series[], isLoading }`
- `useCatalogItemTitle(contentId)` → `string | undefined`

**Función de estadísticas:**
```typescript
// src/features/profile/lib/computeUserStats.ts
computeUserStats(reviews: Review[]): {
  totalReviews: number
  averageRating: number | null
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>
}
```

**Tipos relevantes:**
```typescript
// src/shared/types/index.ts
CONTENT_TYPE_LABELS: Record<ContentType, { en: string; es: string; icon: string }>
// ej: { movie: { en: 'Movie', es: 'Película', icon: '🎬' } }
```

**Rutas disponibles:**
```typescript
ROUTES.MOVIES = '/movies'
ROUTES.SERIES = '/series'
ROUTES.REVIEWS = '/reviews'
ROUTES.GROUPS = '/groups'
ROUTES.MOVIE_DETAIL = (id: string) => `/movies/${id}`
ROUTES.SERIES_DETAIL = (id: string) => `/series/${id}`
```

**ReviewCard** (`src/features/reviews/components/ReviewCard.tsx`):
- Props: `review`, `onEdit?`, `onDelete?`
- Ya muestra título del ítem (del catálogo) en el footer via `useCatalogItemTitle`

**ReviewForm** (`src/features/reviews/components/ReviewForm.tsx`):
- Props: `mode`, `review?`, `initialValues?`, `onSuccess?`, `onCancel?`
- Acepta `initialValues?: Partial<ReviewFormValues>` para pre-poblar campos

**Lo que hay que crear:**
- `src/features/dashboard/components/DashboardPage.tsx` — componente principal
- `src/features/dashboard/components/RecentReviewsSection.tsx` — últimas N reviews con link a /reviews
- `src/features/dashboard/components/QuickStatsSection.tsx` — total reviews + avg rating + breakdown por tipo
- `src/features/dashboard/components/CatalogHighlightsSection.tsx` — cards de películas/series recientes con indicador de review
- `src/features/dashboard/components/index.ts` — barrel
- `src/app/(app)/page.tsx` — reemplazar placeholder

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

---

## Task 1: QuickStatsSection — bloque de estadísticas rápidas

Componente de presentación que muestra el total de reviews, promedio de rating y un mini-breakdown por content type. Reutiliza `computeUserStats` y los átomos `StatsCard` y `RatingStars` ya existentes.

**Files:**
- Create: `src/features/dashboard/components/QuickStatsSection.tsx`

**Step 1: Crear `src/features/dashboard/components/QuickStatsSection.tsx`**

```tsx
// src/features/dashboard/components/QuickStatsSection.tsx
import { BookOpenIcon, StarIcon } from 'lucide-react'
import { StatsCard, RatingStars } from '@/shared/ui/atoms'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { computeUserStats } from '@/features/profile/lib/computeUserStats'
import type { Review } from '@/entities/review/types'

interface QuickStatsSectionProps {
  reviews: Review[]
}

export function QuickStatsSection({ reviews }: QuickStatsSectionProps) {
  const stats = computeUserStats(reviews)

  const activeTypes = (
    Object.entries(stats.reviewsByContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][]
  )
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Overview
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard
          label="Total Reviews"
          value={stats.totalReviews}
          icon={<BookOpenIcon className="size-4" />}
        />
        <StatsCard
          label="Avg Rating"
          value={stats.averageRating !== null ? stats.averageRating : '—'}
          icon={<StarIcon className="size-4" />}
        />
      </div>

      {activeTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {activeTypes.map(([contentType, count]) => {
            const label = CONTENT_TYPE_LABELS[contentType]
            return (
              <div
                key={contentType}
                className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-lg" aria-hidden>{label.icon}</span>
                <div>
                  <p className="text-sm font-medium">{count}</p>
                  <p className="text-xs text-muted-foreground">{label.en}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stats.averageRating !== null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RatingStars value={Math.round(stats.averageRating) as 1 | 2 | 3 | 4 | 5} readonly size="sm" />
          <span>average across {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}</span>
        </div>
      )}
    </section>
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
git add src/features/dashboard/components/QuickStatsSection.tsx
git commit -m "feat: add QuickStatsSection dashboard component"
```

---

## Task 2: RecentReviewsSection — últimas reviews con link a todas

Muestra las últimas 3 reviews del usuario con `ReviewCard`. Si no hay reviews, muestra un `EmptyState` con CTA para ir a `/reviews`. Siempre incluye un link "See all" al final cuando hay reviews.

**Files:**
- Create: `src/features/dashboard/components/RecentReviewsSection.tsx`

**Step 1: Crear `src/features/dashboard/components/RecentReviewsSection.tsx`**

```tsx
// src/features/dashboard/components/RecentReviewsSection.tsx
import Link from 'next/link'
import { StarIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/shared/ui/atoms'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ROUTES } from '@/shared/constants'
import type { Review } from '@/entities/review/types'

interface RecentReviewsSectionProps {
  reviews: Review[]
}

const MAX_RECENT = 3

export function RecentReviewsSection({ reviews }: RecentReviewsSectionProps) {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const recent = sorted.slice(0, MAX_RECENT)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent Reviews
        </h2>
        {reviews.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.REVIEWS}>
              See all
              <ArrowRightIcon />
            </Link>
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews yet"
          description="Start reviewing movies and series from the catalog."
          action={
            <Button size="sm" asChild>
              <Link href={ROUTES.MOVIES}>Browse Movies</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
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
git add src/features/dashboard/components/RecentReviewsSection.tsx
git commit -m "feat: add RecentReviewsSection dashboard component"
```

---

## Task 3: CatalogHighlightsSection — accesos directos al catálogo

Muestra una fila horizontal scrollable de posters del catálogo (primeras 8 películas o series, alternando o una categoría a elección). Cada ítem es clickeable y navega al detalle. Si el usuario ya tiene review de ese ítem, muestra el indicador de estrella. Incluye header con link a `/movies` y `/series`.

**Files:**
- Create: `src/features/dashboard/components/CatalogHighlightsSection.tsx`

**Step 1: Crear `src/features/dashboard/components/CatalogHighlightsSection.tsx`**

```tsx
// src/features/dashboard/components/CatalogHighlightsSection.tsx
'use client'

import Link from 'next/link'
import { ArrowRightIcon, FilmIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CatalogItemCard } from '@/features/catalog/components'
import { useMovies } from '@/features/catalog/hooks'
import { ROUTES } from '@/shared/constants'
import type { Review } from '@/entities/review/types'

interface CatalogHighlightsSectionProps {
  reviews: Review[]
}

const MAX_HIGHLIGHTS = 8

export function CatalogHighlightsSection({ reviews }: CatalogHighlightsSectionProps) {
  const { data: movies = [], isLoading } = useMovies()

  const reviewedContentIds = new Set(reviews.map((r) => r.contentId))
  const highlights = movies.slice(0, MAX_HIGHLIGHTS)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Movies
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.MOVIES}>
            See all
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-28 aspect-[2/3] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <FilmIcon className="size-4 shrink-0" />
          <span>Catalog not loaded yet. Visit the Movies page to seed the catalog.</span>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {highlights.map((movie) => (
            <div key={movie.id} className="shrink-0 w-28">
              <CatalogItemCard
                item={movie}
                hasReview={reviewedContentIds.has(movie.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
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
git add src/features/dashboard/components/CatalogHighlightsSection.tsx
git commit -m "feat: add CatalogHighlightsSection dashboard component"
```

---

## Task 4: DashboardPage — componente principal + barrel + route

Ensambla las tres secciones en la página principal. Muestra el saludo personalizado con el nombre del usuario. Incluye un CTA de "Add Review" en el header que abre el `ReviewForm` en un Dialog. Crea el barrel de la feature y reemplaza el route placeholder.

**Files:**
- Create: `src/features/dashboard/components/DashboardPage.tsx`
- Create: `src/features/dashboard/components/index.ts`
- Modify: `src/app/(app)/page.tsx`

**Step 1: Crear `src/features/dashboard/components/DashboardPage.tsx`**

```tsx
// src/features/dashboard/components/DashboardPage.tsx
'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { useUser, useStore } from '@/shared/lib/store'
import { QuickStatsSection } from './QuickStatsSection'
import { RecentReviewsSection } from './RecentReviewsSection'
import { CatalogHighlightsSection } from './CatalogHighlightsSection'

export function DashboardPage() {
  const user = useUser()
  const reviews = useStore((s) => s.reviews)
  const [isAddingReview, setIsAddingReview] = useState(false)

  const greeting = user ? `Welcome back, ${user.displayName}` : 'Welcome back'

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {reviews.length === 0
              ? 'Start reviewing your favorite movies and series.'
              : `You have ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} so far.`}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddingReview(true)}>
          <PlusIcon />
          Add Review
        </Button>
      </div>

      {/* Quick Stats — only if there are reviews */}
      {reviews.length > 0 && (
        <QuickStatsSection reviews={reviews} />
      )}

      {/* Catalog Highlights */}
      <CatalogHighlightsSection reviews={reviews} />

      {/* Recent Reviews */}
      <RecentReviewsSection reviews={reviews} />

      {/* Add Review Dialog */}
      <Dialog open={isAddingReview} onOpenChange={setIsAddingReview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
          </DialogHeader>
          {isAddingReview && (
            <ReviewForm
              mode="create"
              onSuccess={() => setIsAddingReview(false)}
              onCancel={() => setIsAddingReview(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 2: Crear barrel `src/features/dashboard/components/index.ts`**

```typescript
// src/features/dashboard/components/index.ts
export { DashboardPage } from './DashboardPage'
export { QuickStatsSection } from './QuickStatsSection'
export { RecentReviewsSection } from './RecentReviewsSection'
export { CatalogHighlightsSection } from './CatalogHighlightsSection'
```

**Step 3: Reemplazar `src/app/(app)/page.tsx`**

```tsx
// src/app/(app)/page.tsx
import { DashboardPage } from '@/features/dashboard/components'

export default function HomeRoute() {
  return <DashboardPage />
}
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 5: Commit**

```bash
git add src/features/dashboard/components/DashboardPage.tsx src/features/dashboard/components/index.ts src/app/(app)/page.tsx
git commit -m "feat: add dashboard page with stats, recent reviews and catalog highlights"
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
git log --oneline -6
```

Expected (de más reciente a más antiguo):
```
feat: add dashboard page with stats, recent reviews and catalog highlights
feat: add CatalogHighlightsSection dashboard component
feat: add RecentReviewsSection dashboard component
feat: add QuickStatsSection dashboard component
feat: add catalog components barrel and show item title in ReviewCard  ← último de Sprint 5
```

**Step 3: Verificar estructura nueva del sprint**

```
src/features/dashboard/
  components/
    DashboardPage.tsx
    QuickStatsSection.tsx
    RecentReviewsSection.tsx
    CatalogHighlightsSection.tsx
    index.ts
src/app/(app)/page.tsx  ← reemplazado
```
