# Sprint 3 — Onboarding, Profile & Review Filtering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar el onboarding de usuario (reemplazar el dev seed del Sprint 2), la página de perfil con edición y stats, y filtrado/búsqueda de reviews por tipo de contenido y estado.

**Architecture:** Feature-Sliced Design. El onboarding es una ruta pública fuera del route group `(app)`. El perfil vive en `src/features/profile/`. El filtrado de reviews extiende la feature existente en `src/features/reviews/` sin tocar la lógica de persistencia. El estado de filtros es local al componente (no va al store global — YAGNI).

**Tech Stack:** Next.js 16 App Router, shadcn/ui (Base UI / base-mira), Zustand 5 + Immer, TanStack Query v5, TanStack Form v1, Zod 4, TypeScript strict, Tailwind 4. Todos los comandos de package manager usan `bun`.

---

## Contexto del proyecto

El repo tiene Sprint 1 y Sprint 2 completos (22 commits). Lo que ya existe y es relevante para este sprint:

**Servicios disponibles (todos en `src/shared/services/`):**
- `services.users.get()` → `Promise<User | null>`
- `services.users.create(data: CreateUserDTO)` → `Promise<User>`
- `services.users.update(data: UpdateUserDTO)` → `Promise<User>`
- `services.users.delete()` → `Promise<void>`
- `services.reviews.getByUserId(userId)` → `Promise<Review[]>`

**Store Zustand (`src/shared/lib/store/index.ts`):**
- `useUser()` → selector del usuario actual
- `useStore((s) => s.setUser)` → acción para setear el usuario
- `useStore((s) => s.reviews)` → lista de reviews en memoria

**Tipos relevantes:**
- `User` — `{ id, username, displayName, avatarUrl?, bio?, createdAt, updatedAt }`
- `CreateUserDTO` — `Omit<User, 'id' | 'createdAt' | 'updatedAt'>`
- `UpdateUserDTO` — `Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>`
- `Review` — tiene `contentType: ContentType`, `status: ConsumptionStatus`, `rating?: Rating`
- `ContentType` — `'movie' | 'series' | 'music' | 'game' | 'book' | 'podcast'`
- `ConsumptionStatus` — `'consumed' | 'want_to_consume' | 'consuming' | 'dropped'`
- `CONTENT_TYPE_LABELS` — `Record<ContentType, { en, es, icon }>` — ya existe en `src/shared/types`
- `CONSUMPTION_STATUS_LABELS` — `Record<ConsumptionStatus, Record<ContentType, { en, es }>>` — ya existe

**Lo que hay que reemplazar/extender:**
- `src/shared/hooks/useInitDevUser.ts` — el seed de dev hardcodeado que se creó en Sprint 2. Hay que reemplazarlo con lógica real de onboarding.
- `src/app/(app)/layout.tsx` — actualmente llama a `useInitDevUser`. Hay que cambiar el comportamiento: si no hay usuario, redirigir a `/onboarding`.
- `src/app/(app)/profile/page.tsx` — actualmente es un placeholder. Hay que implementarlo.
- `src/features/reviews/components/ReviewList.tsx` — actualmente lista sin filtros. Hay que agregar filtros.

**Rutas actuales (`ROUTES`):**
```typescript
ROUTES.HOME = '/'
ROUTES.MOVIES = '/movies'
ROUTES.SERIES = '/series'
ROUTES.REVIEWS = '/reviews'
ROUTES.GROUPS = '/groups'
ROUTES.PROFILE = '/profile'
```

`ROUTES.ONBOARDING` no existe todavía — hay que agregarlo.

---

## Task 1: Agregar ROUTES.ONBOARDING a las constantes

**Files:**
- Modify: `src/shared/constants/index.ts`

**Step 1: Agregar la ruta de onboarding**

En `src/shared/constants/index.ts`, dentro del objeto `ROUTES`, agregar:

```typescript
ONBOARDING: '/onboarding',
```

El objeto completo queda:

```typescript
export const ROUTES = {
  HOME: '/',
  ONBOARDING: '/onboarding',
  MOVIES: '/movies',
  MOVIE_DETAIL: (id: string) => `/movies/${id}`,
  SERIES: '/series',
  SERIES_DETAIL: (id: string) => `/series/${id}`,
  REVIEWS: '/reviews',
  GROUPS: '/groups',
  GROUP_DETAIL: (id: string) => `/groups/${id}`,
  PROFILE: '/profile',
} as const
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 3: Commit**

```bash
git add src/shared/constants/index.ts
git commit -m "feat: add ONBOARDING route constant"
```

---

## Task 2: Página de onboarding — formulario de creación de usuario

El onboarding es una ruta pública (`src/app/onboarding/`) fuera del route group `(app)`, sin sidebar. El usuario completa su `displayName` y `username`. Al enviar, se crea el usuario en localStorage y se redirige a `/`.

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/features/onboarding/components/OnboardingForm.tsx`

**Nota importante sobre la API de TanStack Form v1 en este proyecto:**

NO pasar genérico explícito: ~~`useForm<MyType>({})`~~ — provoca error TypeScript "Expected 12 type args".
CORRECTO: dejar que TypeScript infiera desde `defaultValues`:
```typescript
type FormData = z.input<typeof schema>
const defaultValues: FormData = { ... }
const form = useForm({ defaultValues, ... })
```

Los errores de campos son `unknown[]`. Para mostrarlos, usar este helper (definirlo dentro del componente):
```typescript
function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}
```

`form.Subscribe` necesita `as const`:
```typescript
<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
```

**Step 1: Instalar shadcn `card`**

```bash
bunx shadcn@latest add card
```

**Step 2: Crear `src/features/onboarding/components/OnboardingForm.tsx`**

```tsx
// src/features/onboarding/components/OnboardingForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less'),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
})

type FormData = z.input<typeof onboardingSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

export function OnboardingForm() {
  const router = useRouter()
  const setUser = useStore((s) => s.setUser)

  const defaultValues: FormData = {
    username: '',
    displayName: '',
    bio: '',
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: onboardingSchema },
    onSubmit: async ({ value }) => {
      const user = await services.users.create({
        username: value.username,
        displayName: value.displayName,
        bio: value.bio || undefined,
      })
      setUser(user)
      router.push(ROUTES.HOME)
    },
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to Things Review</CardTitle>
        <CardDescription>
          Set up your profile to start tracking and reviewing movies, series, books, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          {/* Display Name */}
          <form.Field name="displayName">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Display Name</Label>
                <Input
                  id={field.name}
                  placeholder="How should we call you?"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoFocus
                />
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">
                    {getError(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Username */}
          <form.Field name="username">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Username</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">@</span>
                  <Input
                    id={field.name}
                    placeholder="your_username"
                    className="pl-7"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                    onBlur={field.handleBlur}
                  />
                </div>
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">
                    {getError(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Bio */}
          <form.Field name="bio">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>
                  Bio <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id={field.name}
                  placeholder="A short description about yourself..."
                  className="resize-none"
                  rows={3}
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">
                    {getError(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Submit */}
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Creating profile...' : 'Get Started'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Crear `src/app/onboarding/page.tsx`**

Esta página NO tiene sidebar — layout mínimo centrado. Es Server Component (no necesita `'use client'`).

```tsx
// src/app/onboarding/page.tsx
import { OnboardingForm } from '@/features/onboarding/components/OnboardingForm'

export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4">
      <OnboardingForm />
    </div>
  )
}
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 5: Commit**

```bash
git add src/app/onboarding/ src/features/onboarding/
git commit -m "feat: add onboarding page with user creation form"
```

---

## Task 3: Reemplazar el dev seed con redirección real a onboarding

El `src/app/(app)/layout.tsx` actualmente llama a `useInitDevUser` que siembra un usuario hardcodeado. Hay que cambiarlo: si no hay usuario en localStorage al montar el layout, redirigir a `/onboarding`. Si hay usuario, cargarlo al store.

El hook `useInitDevUser` se reemplaza por `useAuthGuard`.

**Files:**
- Create: `src/shared/hooks/useAuthGuard.ts`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/shared/hooks/index.ts`

**Step 1: Crear `src/shared/hooks/useAuthGuard.ts`**

```typescript
// src/shared/hooks/useAuthGuard.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/shared/lib/store'
import { services } from '@/shared/services'
import { ROUTES } from '@/shared/constants'

/**
 * Protege las rutas del (app) route group.
 * - Si hay usuario en localStorage → lo carga al store.
 * - Si no hay usuario → redirige a /onboarding.
 * Retorna `isReady: boolean` para evitar render antes de verificar.
 */
export function useAuthGuard(): boolean {
  const [isReady, setIsReady] = useState(false)
  const setUser = useStore((s) => s.setUser)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const user = await services.users.get()
      if (!user) {
        router.replace(ROUTES.ONBOARDING)
        return
      }
      setUser(user)
      setIsReady(true)
    }
    check()
  }, [router, setUser])

  return isReady
}
```

**Step 2: Exportar el hook desde el barrel**

En `src/shared/hooks/index.ts`, reemplazar la export de `useInitDevUser` por `useAuthGuard`:

```typescript
// src/shared/hooks/index.ts
export { useLocalStorage } from './useLocalStorage'
export { useMediaQuery } from './useMediaQuery'
export { useAuthGuard } from './useAuthGuard'
```

> **Nota:** `useInitDevUser` ya no se exporta. El archivo `.ts` puede dejarse como está (no se usa fuera del layout) o borrarse — se borra para no confundir.

**Step 3: Borrar `useInitDevUser.ts`**

```bash
rm src/shared/hooks/useInitDevUser.ts
```

**Step 4: Modificar `src/app/(app)/layout.tsx`**

Reemplazar `useInitDevUser` por `useAuthGuard`. Mientras `isReady` es `false`, mostrar un loading mínimo en lugar del shell completo para evitar flash de contenido sin usuario.

```tsx
// src/app/(app)/layout.tsx
'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/AppHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuthGuard } from '@/shared/hooks'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isReady = useAuthGuard()

  if (!isReady) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: replace dev seed with auth guard - redirect to onboarding if no user"
```

---

## Task 4: Query hooks del perfil (TanStack Query + UserService)

Crear los hooks de TanStack Query para el perfil del usuario: obtener usuario actual y mutación de update. Patrón idéntico a `src/features/reviews/hooks/`.

**Files:**
- Create: `src/features/profile/hooks/useProfile.ts`
- Create: `src/features/profile/hooks/useProfileMutations.ts`
- Create: `src/features/profile/hooks/index.ts`

**Step 1: Crear `src/features/profile/hooks/useProfile.ts`**

```typescript
// src/features/profile/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'

export const PROFILE_QUERY_KEY = ['profile'] as const

export function useProfile() {
  const user = useUser()

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => services.users.get(),
    enabled: !!user,
    // El usuario ya está en el store — esto mantiene TanStack Query en sync
    initialData: user ?? undefined,
  })
}
```

**Step 2: Crear `src/features/profile/hooks/useProfileMutations.ts`**

```typescript
// src/features/profile/hooks/useProfileMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import type { UpdateUserDTO } from '@/entities/user/types'
import { PROFILE_QUERY_KEY } from './useProfile'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setUser = useStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: UpdateUserDTO) => services.users.update(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    },
  })
}
```

**Step 3: Crear barrel `src/features/profile/hooks/index.ts`**

```typescript
// src/features/profile/hooks/index.ts
export { useProfile, PROFILE_QUERY_KEY } from './useProfile'
export { useUpdateProfile } from './useProfileMutations'
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 5: Commit**

```bash
git add src/features/profile/hooks/
git commit -m "feat: add profile query hooks"
```

---

## Task 5: UserStats — cálculo de estadísticas de reviews del usuario

Crear una función utilitaria y un hook que calculan las estadísticas del usuario a partir de sus reviews en memoria. No hay backend — se calcula en el cliente.

**Files:**
- Create: `src/features/profile/lib/computeUserStats.ts`
- Create: `src/features/profile/hooks/useUserStats.ts`

**Step 1: Crear `src/features/profile/lib/computeUserStats.ts`**

```typescript
// src/features/profile/lib/computeUserStats.ts
import type { Review } from '@/entities/review/types'
import type { ContentType, Rating } from '@/shared/types'

export interface UserStats {
  totalReviews: number
  averageRating: number | null        // null si no hay ratings
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>
}

const RATINGS: Rating[] = [1, 2, 3, 4, 5]
const CONTENT_TYPES: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

export function computeUserStats(reviews: Review[]): UserStats {
  const totalReviews = reviews.length

  // Rating distribution
  const ratingDistribution = Object.fromEntries(
    RATINGS.map((r) => [r, 0])
  ) as Record<Rating, number>

  let ratingSum = 0
  let ratingCount = 0

  for (const review of reviews) {
    if (review.rating) {
      ratingDistribution[review.rating]++
      ratingSum += review.rating
      ratingCount++
    }
  }

  const averageRating = ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : null

  // Reviews por content type
  const reviewsByContentType = Object.fromEntries(
    CONTENT_TYPES.map((ct) => [ct, 0])
  ) as Record<ContentType, number>

  for (const review of reviews) {
    reviewsByContentType[review.contentType]++
  }

  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    reviewsByContentType,
  }
}
```

**Step 2: Crear `src/features/profile/hooks/useUserStats.ts`**

```typescript
// src/features/profile/hooks/useUserStats.ts
import { useMemo } from 'react'
import { useStore } from '@/shared/lib/store'
import { computeUserStats } from '../lib/computeUserStats'

export function useUserStats() {
  const reviews = useStore((s) => s.reviews)
  return useMemo(() => computeUserStats(reviews), [reviews])
}
```

**Step 3: Agregar `useUserStats` al barrel de hooks del perfil**

En `src/features/profile/hooks/index.ts`, agregar la export:

```typescript
// src/features/profile/hooks/index.ts
export { useProfile, PROFILE_QUERY_KEY } from './useProfile'
export { useUpdateProfile } from './useProfileMutations'
export { useUserStats } from './useUserStats'
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 5: Commit**

```bash
git add src/features/profile/
git commit -m "feat: add user stats computation hook"
```

---

## Task 6: ProfileForm — formulario de edición del perfil

Mismo patrón que `ReviewForm`: TanStack Form v1 + Zod Standard Schema. Solo los campos editables de `UpdateUserDTO`: `displayName`, `avatarUrl`, `bio`.

**Files:**
- Create: `src/features/profile/components/ProfileForm.tsx`

**Step 1: Crear `src/features/profile/components/ProfileForm.tsx`**

```tsx
// src/features/profile/components/ProfileForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { User } from '@/entities/user/types'
import { useUpdateProfile } from '../hooks'

const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less'),
  avatarUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
})

type FormData = z.input<typeof profileSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

interface ProfileFormProps {
  user: User
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfileForm({ user, onSuccess, onCancel }: ProfileFormProps) {
  const updateProfile = useUpdateProfile()

  const defaultValues: FormData = {
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? '',
    bio: user.bio ?? '',
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: profileSchema },
    onSubmit: async ({ value }) => {
      await updateProfile.mutateAsync({
        displayName: value.displayName,
        avatarUrl: value.avatarUrl || undefined,
        bio: value.bio || undefined,
      })
      onSuccess?.()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* Display Name */}
      <form.Field name="displayName">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Display Name</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">
                {getError(field.state.meta.errors)}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Avatar URL */}
      <form.Field name="avatarUrl">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Avatar URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={field.name}
              placeholder="https://..."
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">
                {getError(field.state.meta.errors)}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Bio */}
      <form.Field name="bio">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Bio <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              placeholder="Tell us a bit about yourself..."
              className="resize-none"
              rows={3}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">
                {getError(field.state.meta.errors)}
              </p>
            )}
          </div>
        )}
      </form.Field>

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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 3: Commit**

```bash
git add src/features/profile/components/ProfileForm.tsx
git commit -m "feat: add ProfileForm component"
```

---

## Task 7: StatsCard — átomo visual para mostrar una estadística

Crear un componente atómico reutilizable `StatsCard` para mostrar un número con label. Se usa en la página de perfil.

**Files:**
- Create: `src/shared/ui/atoms/StatsCard.tsx`
- Modify: `src/shared/ui/atoms/index.ts`

**Step 1: Crear `src/shared/ui/atoms/StatsCard.tsx`**

```tsx
// src/shared/ui/atoms/StatsCard.tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 flex flex-col gap-1',
      className
    )}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <span className="size-4">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
```

**Step 2: Agregar export al barrel de átomos**

En `src/shared/ui/atoms/index.ts`, agregar:

```typescript
export { StatsCard } from './StatsCard'
```

El archivo completo queda:

```typescript
// src/shared/ui/atoms/index.ts
export { RatingStars } from './RatingStars'
export { ContentTypeBadge } from './ContentTypeBadge'
export { StatusBadge } from './StatusBadge'
export { EmptyState } from './EmptyState'
export { StatsCard } from './StatsCard'
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 4: Commit**

```bash
git add src/shared/ui/atoms/
git commit -m "feat: add StatsCard atom"
```

---

## Task 8: ProfilePage — página de perfil completa

Implementar `src/app/(app)/profile/page.tsx` con tres secciones:
1. **Header de usuario** — avatar, nombre, username, bio
2. **Stats** — total reviews, rating promedio, distribución por tipo de contenido
3. **Edición de perfil** — botón que abre un Dialog con `ProfileForm`

**Files:**
- Create: `src/features/profile/components/ProfilePage.tsx`
- Create: `src/features/profile/components/index.ts`
- Modify: `src/app/(app)/profile/page.tsx`

**Step 1: Crear `src/features/profile/components/ProfilePage.tsx`**

```tsx
// src/features/profile/components/ProfilePage.tsx
'use client'

import { useState } from 'react'
import { PencilIcon, StarIcon, BookOpenIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StatsCard, RatingStars } from '@/shared/ui/atoms'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { useProfile, useUserStats } from '../hooks'
import { ProfileForm } from './ProfileForm'

export function ProfilePage() {
  const { data: user } = useProfile()
  const stats = useUserStats()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

  const initials = user.displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-2xl">
      {/* User Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 rounded-xl">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback className="rounded-xl text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-semibold">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-foreground/80 pt-1">{user.bio}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <PencilIcon />
          Edit Profile
        </Button>
      </div>

      <Separator />

      {/* Stats Overview */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Overview</h2>
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
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Rating Breakdown</h2>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const count = stats.ratingDistribution[rating]
                const pct = stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <RatingStars value={rating} readonly size="sm" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Reviews by Content Type */}
      {stats.totalReviews > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">By Type</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.entries(stats.reviewsByContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][])
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([contentType, count]) => {
                  const label = CONTENT_TYPE_LABELS[contentType]
                  return (
                    <div key={contentType} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                      <span className="text-lg" aria-hidden>{label.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{count}</p>
                        <p className="text-xs text-muted-foreground">{label.en}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileForm
            user={user}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 2: Crear barrel `src/features/profile/components/index.ts`**

```typescript
// src/features/profile/components/index.ts
export { ProfileForm } from './ProfileForm'
export { ProfilePage } from './ProfilePage'
```

**Step 3: Modificar `src/app/(app)/profile/page.tsx`**

```tsx
// src/app/(app)/profile/page.tsx
import { ProfilePage } from '@/features/profile/components'

export default function ProfileRoute() {
  return <ProfilePage />
}
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 5: Commit**

```bash
git add src/features/profile/components/ src/app/(app)/profile/
git commit -m "feat: add profile page with stats and edit form"
```

---

## Task 9: Filtros de reviews — ContentType y ConsumptionStatus

Extender `ReviewList` para filtrar reviews por tipo de contenido y estado. El estado de filtros vive en `useState` local — no va al store global (son filtros de UI temporales).

La UI de filtros son dos grupos de toggle buttons (uno por `ContentType`, otro por `ConsumptionStatus`). Un filtro activo se resalta visualmente. Se pueden combinar: si ambos filtros están activos, se aplican los dos (AND). Si ninguno está activo, muestra todos.

**Files:**
- Create: `src/features/reviews/components/ReviewFilters.tsx`
- Modify: `src/features/reviews/components/ReviewList.tsx`
- Modify: `src/features/reviews/components/index.ts`

**Step 1: Crear `src/features/reviews/components/ReviewFilters.tsx`**

```tsx
// src/features/reviews/components/ReviewFilters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS, CONSUMPTION_STATUS_LABELS } from '@/shared/types'
import type { ContentType, ConsumptionStatus } from '@/shared/types'

// Usamos 'movie' como proxy para los labels genéricos de status
const STATUS_LIST: ConsumptionStatus[] = ['consumed', 'consuming', 'want_to_consume', 'dropped']
const CONTENT_TYPE_LIST: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

interface ReviewFiltersProps {
  selectedContentTypes: ContentType[]
  selectedStatuses: ConsumptionStatus[]
  onContentTypeToggle: (ct: ContentType) => void
  onStatusToggle: (status: ConsumptionStatus) => void
  onClearAll: () => void
  totalResults: number
  totalReviews: number
}

export function ReviewFilters({
  selectedContentTypes,
  selectedStatuses,
  onContentTypeToggle,
  onStatusToggle,
  onClearAll,
  totalResults,
  totalReviews,
}: ReviewFiltersProps) {
  const hasFilters = selectedContentTypes.length > 0 || selectedStatuses.length > 0
  const isFiltered = hasFilters && totalResults < totalReviews

  return (
    <div className="space-y-3">
      {/* Content Type filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Type:</span>
        {CONTENT_TYPE_LIST.map((ct) => {
          const label = CONTENT_TYPE_LABELS[ct]
          const isActive = selectedContentTypes.includes(ct)
          return (
            <Button
              key={ct}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => onContentTypeToggle(ct)}
              className={cn('gap-1', isActive && 'shadow-none')}
            >
              <span aria-hidden>{label.icon}</span>
              {label.en}
            </Button>
          )
        })}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
        {STATUS_LIST.map((status) => {
          // Usamos 'movie' como proxy para el label genérico
          const label = CONSUMPTION_STATUS_LABELS[status]['movie'].en
          const isActive = selectedStatuses.includes(status)
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => onStatusToggle(status)}
              className={cn(isActive && 'shadow-none')}
            >
              {label}
            </Button>
          )
        })}
      </div>

      {/* Clear + result count */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isFiltered ? `${totalResults} of ${totalReviews} reviews` : `${totalReviews} reviews`}
          </span>
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Modificar `src/features/reviews/components/ReviewList.tsx`**

Agregar el estado de filtros y la lógica de filtrado. El componente `ReviewFilters` se renderiza encima del grid.

Reemplazar el contenido de `ReviewList.tsx` completo:

```tsx
// src/features/reviews/components/ReviewList.tsx
'use client'

import { useState, useMemo } from 'react'
import { PlusIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import type { ContentType, ConsumptionStatus } from '@/shared/types'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { ReviewFilters } from './ReviewFilters'
import { useReviews, useDeleteReview } from '../hooks'
import type { Review } from '@/entities/review/types'

type UIMode =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; review: Review }
  | { type: 'delete'; review: Review }

export function ReviewList() {
  const { data: reviews = [], isLoading } = useReviews()
  const deleteReview = useDeleteReview()
  const [mode, setMode] = useState<UIMode>({ type: 'idle' })

  // Filter state — local UI state, no store
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<ConsumptionStatus[]>([])

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesType = selectedContentTypes.length === 0
        || selectedContentTypes.includes(review.contentType)
      const matchesStatus = selectedStatuses.length === 0
        || selectedStatuses.includes(review.status)
      return matchesType && matchesStatus
    })
  }, [reviews, selectedContentTypes, selectedStatuses])

  function toggleContentType(ct: ContentType) {
    setSelectedContentTypes((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    )
  }

  function toggleStatus(status: ConsumptionStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  function clearFilters() {
    setSelectedContentTypes([])
    setSelectedStatuses([])
  }

  function handleEdit(review: Review) {
    setMode({ type: 'edit', review })
  }

  function handleDelete(review: Review) {
    setMode({ type: 'delete', review })
  }

  async function confirmDelete() {
    if (mode.type !== 'delete') return
    await deleteReview.mutateAsync(mode.review.id)
    setMode({ type: 'idle' })
  }

  const isFormOpen = mode.type === 'create' || mode.type === 'edit'

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Reviews</h1>
        <Button onClick={() => setMode({ type: 'create' })} size="sm">
          <PlusIcon />
          Add Review
        </Button>
      </div>

      {/* Filters — only show if there's something to filter */}
      {reviews.length > 0 && (
        <ReviewFilters
          selectedContentTypes={selectedContentTypes}
          selectedStatuses={selectedStatuses}
          onContentTypeToggle={toggleContentType}
          onStatusToggle={toggleStatus}
          onClearAll={clearFilters}
          totalResults={filteredReviews.length}
          totalReviews={reviews.length}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews yet"
          description="Start by adding your first review."
          action={
            <Button onClick={() => setMode({ type: 'create' })} size="sm">
              <PlusIcon />
              Add your first review
            </Button>
          }
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews match your filters"
          description="Try adjusting or clearing the filters."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setMode({ type: 'idle' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode.type === 'create' ? 'Add Review' : 'Edit Review'}
            </DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <ReviewForm
              mode={mode.type === 'create' ? 'create' : 'edit'}
              review={mode.type === 'edit' ? mode.review : undefined}
              onSuccess={() => setMode({ type: 'idle' })}
              onCancel={() => setMode({ type: 'idle' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={mode.type === 'delete'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The review will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode({ type: 'idle' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 3: Agregar `ReviewFilters` al barrel de componentes**

En `src/features/reviews/components/index.ts`:

```typescript
// src/features/reviews/components/index.ts
export { ReviewCard } from './ReviewCard'
export { ReviewFilters } from './ReviewFilters'
export { ReviewForm } from './ReviewForm'
export { ReviewList } from './ReviewList'
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 5: Commit**

```bash
git add src/features/reviews/components/
git commit -m "feat: add content type and status filters to ReviewList"
```

---

## Verificación final

Después de completar todas las tasks:

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
feat: add content type and status filters to ReviewList
feat: add profile page with stats and edit form
feat: add StatsCard atom
feat: add user stats computation hook
feat: add ProfileForm component
feat: add profile query hooks
feat: replace dev seed with auth guard - redirect to onboarding if no user
feat: add onboarding page with user creation form
feat: add ONBOARDING route constant
feat: add AppHeader with breadcrumb to app shell layout  ← último de Sprint 2
```

**Step 3: Verificar estructura nueva del sprint**

```bash
find src/features/profile src/features/onboarding src/app/onboarding -type f | sort
```

Expected:
```
src/app/onboarding/page.tsx
src/features/onboarding/components/OnboardingForm.tsx
src/features/profile/components/ProfileForm.tsx
src/features/profile/components/ProfilePage.tsx
src/features/profile/components/index.ts
src/features/profile/hooks/index.ts
src/features/profile/hooks/useProfile.ts
src/features/profile/hooks/useProfileMutations.ts
src/features/profile/hooks/useUserStats.ts
src/features/profile/lib/computeUserStats.ts
```

**Step 4: Verificar que no quedan referencias a `useInitDevUser`**

```bash
rg "useInitDevUser" src/
```

Expected: Sin resultados.
