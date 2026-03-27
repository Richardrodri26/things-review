# Sprint 2 — App Shell & Review CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir el app shell completo (sidebar + layout de rutas) y el CRUD de reviews: crear, listar, editar y eliminar reviews de películas/series, con persistencia en localStorage y UI funcional.

**Architecture:** Feature-Sliced Design. El shell vive en `src/app/(app)/layout.tsx` (route group). Las features de reviews viven en `src/features/reviews/`. Los componentes atómicos compartidos van en `src/shared/ui/`. El sidebar usa el componente `sidebar-07` de shadcn adaptado con la navegación real de la app.

**Tech Stack:** Next.js 16 App Router, shadcn/ui sidebar-07 (Base UI / base-mira), Zustand 5 + Immer, TanStack Query v5, Zod 4, TypeScript strict, Tailwind 4. Todos los comandos de package manager usan `bun`.

---

## Contexto del proyecto

El repo tiene:
- Sprint 1 completo: tipos, schemas Zod, Zustand store (user/reviews/groups/ui slices), servicios localStorage, TanStack Query, next-intl EN/ES, hooks genéricos
- `src/app/layout.tsx` — root layout con `<Providers>` (QueryClient) y `<DirectionProvider>`
- `src/shared/services/` — `LocalReviewService`, `LocalUserService`, `LocalGroupService`
- `src/shared/lib/store/` — `useStore`, `useUser`, `useReviews`, `useGroups`
- `src/shared/constants/` — `ROUTES`, `STORAGE_KEYS`, `QUERY_CONFIG`
- `src/entities/review/types.ts` — `Review`, `CreateReviewDTO`, `UpdateReviewDTO`
- `src/entities/review/schema.ts` — `reviewSchema`, `createReviewDTOSchema`, `updateReviewDTOSchema`
- `src/components/ui/` — button, separator, direction (shadcn base-mira)
- `components.json` — style `base-mira`, aliases `@/components`, `@/lib`, `@/hooks`

**Lo que NO tiene todavía:**
- Rutas reales (solo `src/app/page.tsx` con placeholder de Next.js)
- App shell / sidebar
- Ninguna feature implementada
- Usuario en localStorage (no hay onboarding aún — el Sprint 2 crea un usuario hardcodeado para desarrollo)

---

## Task 1: Instalar sidebar-07 de shadcn

**Files:**
- Create: `src/components/ui/input.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/breadcrumb.tsx`, `src/components/ui/collapsible.tsx`, `src/components/ui/dropdown-menu.tsx`, `src/components/ui/avatar.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/sidebar.tsx`
- Create: `src/hooks/use-mobile.ts`
- Create: `src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/nav-projects.tsx`, `src/components/nav-user.tsx`, `src/components/team-switcher.tsx`
- Create: `src/app/dashboard/page.tsx` (shadcn demo — se elimina después)

**Step 1: Instalar sidebar-07**

```bash
cd /home/rrodriguez/richard/things-review && bunx shadcn@latest add sidebar-07
```

Confirmar con `y` si pregunta por sobrescribir archivos existentes.

**Step 2: Verificar archivos creados**

```bash
ls src/components/ui/sidebar.tsx src/components/app-sidebar.tsx src/hooks/use-mobile.ts
```

Expected: los 3 archivos existen.

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/components/ src/hooks/ src/app/dashboard/
git commit -m "chore: install shadcn sidebar-07 components"
```

---

## Task 2: Crear route group (app) con layout del shell

El sidebar-07 usa `SidebarProvider` en el layout de cada ruta, NO en el root layout. Se crea un route group `(app)` para que todas las páginas con sidebar compartan este layout, sin afectar la URL.

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/page.tsx` (redirect o placeholder home)
- Delete concept: `src/app/dashboard/page.tsx` (el demo de shadcn — reemplazarlo con nuestro layout)

**Step 1: Crear `src/app/(app)/layout.tsx`**

```tsx
// src/app/(app)/layout.tsx
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Step 2: Crear `src/app/(app)/page.tsx`** — home placeholder hasta Sprint 3

```tsx
// src/app/(app)/page.tsx
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Things Review</h1>
      <p className="text-muted-foreground">Sprint 2 — shell activo ✓</p>
    </div>
  )
}
```

**Step 3: Redirigir `src/app/page.tsx` al route group**

Reemplazar el contenido actual de `src/app/page.tsx` (el placeholder de Next.js) con un redirect:

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/')
}
```

> **NOTA:** El route group `(app)` hace que `src/app/(app)/page.tsx` responda en `/`. El `src/app/page.tsx` ya no debería existir si ambos mapean a `/`. Simplemente borrar `src/app/page.tsx` — el `(app)/page.tsx` lo reemplaza.

**Step 3 (correcto): Eliminar `src/app/page.tsx`**

```bash
rm src/app/page.tsx
```

**Step 4: Eliminar el dashboard demo de shadcn**

```bash
rm -rf src/app/dashboard/
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add (app) route group with sidebar shell layout"
```

---

## Task 3: Adaptar AppSidebar con la navegación real de la app

El `app-sidebar.tsx` que instaló shadcn tiene data de demo (Acme Inc, Playground, etc.). Hay que reemplazarlo con la navegación real: Movies, Series, Reviews, Groups, Profile. Eliminar `TeamSwitcher` y `NavProjects` — no aplican a esta app.

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/nav-main.tsx` — simplificar: nav sin sub-items colapsables para rutas de primer nivel
- Modify: `src/components/nav-user.tsx` — adaptar para usar `User` del store

**Step 1: Reemplazar `src/components/app-sidebar.tsx`**

```tsx
// src/components/app-sidebar.tsx
'use client'

import * as React from 'react'
import {
  FilmIcon,
  TvIcon,
  StarIcon,
  UsersIcon,
  UserCircleIcon,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { ROUTES } from '@/shared/constants'

const navItems = [
  { title: 'Movies',  url: ROUTES.MOVIES,  icon: <FilmIcon /> },
  { title: 'Series',  url: ROUTES.SERIES,  icon: <TvIcon /> },
  { title: 'Reviews', url: ROUTES.REVIEWS, icon: <StarIcon /> },
  { title: 'Groups',  url: ROUTES.GROUPS,  icon: <UsersIcon /> },
  { title: 'Profile', url: ROUTES.PROFILE, icon: <UserCircleIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={ROUTES.HOME}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  TR
                </div>
                <div className="grid flex-1 text-start leading-tight">
                  <span className="truncate font-semibold text-sm">Things Review</span>
                  <span className="truncate text-xs text-muted-foreground">Your reviews, together</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

**Step 2: Reemplazar `src/components/nav-main.tsx`** — sin sub-items, rutas directas

```tsx
// src/components/nav-main.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
              tooltip={item.title}
            >
              <Link href={item.url}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
```

**Step 3: Reemplazar `src/components/nav-user.tsx`** — conectar con Zustand store

```tsx
// src/components/nav-user.tsx
'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronsUpDownIcon, UserCircleIcon, LogOutIcon } from 'lucide-react'
import { useUser } from '@/shared/lib/store'

export function NavUser() {
  const { isMobile } = useSidebar()
  const user = useUser()

  const displayName = user?.displayName ?? 'Guest'
  const username = user?.username ?? 'guest'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user?.avatarUrl} alt={displayName} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">@{username}</span>
            </div>
            <ChevronsUpDownIcon className="ms-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user?.avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">@{username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircleIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

**Step 4: Eliminar archivos del demo que ya no se usan**

```bash
rm src/components/team-switcher.tsx src/components/nav-projects.tsx
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: adapt sidebar with app navigation and user from store"
```

---

## Task 4: Crear rutas de la app y seed de usuario para desarrollo

Crear las páginas vacías para cada ruta, y un hook `useInitDevUser` que siembra un usuario en localStorage al arrancar la app (solo para desarrollo — Sprint 3 hará el onboarding real).

**Files:**
- Create: `src/app/(app)/reviews/page.tsx`
- Create: `src/app/(app)/movies/page.tsx`
- Create: `src/app/(app)/series/page.tsx`
- Create: `src/app/(app)/groups/page.tsx`
- Create: `src/app/(app)/profile/page.tsx`
- Create: `src/shared/hooks/useInitDevUser.ts`
- Modify: `src/app/(app)/layout.tsx` — llamar al hook de init

**Step 1: Crear las páginas de rutas principales**

Crear las 5 páginas con el mismo patrón de placeholder. Ejemplo para reviews (repetir para el resto):

```tsx
// src/app/(app)/reviews/page.tsx
export default function ReviewsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">My Reviews</h1>
      <p className="text-muted-foreground">Reviews CRUD coming in this sprint.</p>
    </div>
  )
}
```

Crear los mismos archivos para:
- `src/app/(app)/movies/page.tsx` — título "Movies"
- `src/app/(app)/series/page.tsx` — título "Series"
- `src/app/(app)/groups/page.tsx` — título "Groups"
- `src/app/(app)/profile/page.tsx` — título "Profile"

**Step 2: Crear `src/shared/hooks/useInitDevUser.ts`**

Este hook siembra un usuario de desarrollo la primera vez que carga la app si no hay uno en localStorage. Se elimina en Sprint 3 cuando exista el onboarding real.

```typescript
// src/shared/hooks/useInitDevUser.ts
'use client'

import { useEffect } from 'react'
import { useStore } from '@/shared/lib/store'
import { services } from '@/shared/services'

/**
 * DEV ONLY: Siembra un usuario en localStorage si no hay ninguno.
 * Reemplazar en Sprint 3 con el onboarding real.
 */
export function useInitDevUser() {
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    async function init() {
      const existing = await services.users.get()
      if (existing) {
        setUser(existing)
        return
      }
      // Crear usuario de desarrollo
      const devUser = await services.users.create({
        username: 'devuser',
        displayName: 'Dev User',
      })
      setUser(devUser)
    }
    init()
  }, [setUser])
}
```

**Step 3: Modificar `src/app/(app)/layout.tsx`** — usar el hook de init

```tsx
// src/app/(app)/layout.tsx
'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useInitDevUser } from '@/shared/hooks/useInitDevUser'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitDevUser()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Step 4: Exportar el hook nuevo desde el barrel**

Modificar `src/shared/hooks/index.ts` para agregar la export:

```typescript
// src/shared/hooks/index.ts
export { useLocalStorage } from './useLocalStorage'
export { useMediaQuery } from './useMediaQuery'
export { useInitDevUser } from './useInitDevUser'
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app routes and dev user seed hook"
```

---

## Task 5: Query hooks de reviews (TanStack Query + localStorage service)

Crear los hooks de TanStack Query que encapsulan todas las operaciones de reviews. Estos hooks son el puente entre los componentes y el `LocalReviewService`.

**Files:**
- Create: `src/features/reviews/hooks/useReviews.ts`
- Create: `src/features/reviews/hooks/useReviewMutations.ts`
- Create: `src/features/reviews/hooks/index.ts`

**Step 1: Crear `src/features/reviews/hooks/useReviews.ts`**

```typescript
// src/features/reviews/hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'

export const REVIEWS_QUERY_KEY = ['reviews'] as const

export function useReviews() {
  const user = useUser()

  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return services.reviews.getByUserId(user.id)
    },
    enabled: !!user?.id,
  })
}

export function useReviewsByContent(contentId: string) {
  return useQuery({
    queryKey: [...REVIEWS_QUERY_KEY, 'content', contentId],
    queryFn: () => services.reviews.getByContentId(contentId),
    enabled: !!contentId,
  })
}
```

**Step 2: Crear `src/features/reviews/hooks/useReviewMutations.ts`**

```typescript
// src/features/reviews/hooks/useReviewMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import type { CreateReviewDTO, UpdateReviewDTO } from '@/entities/review/types'
import { REVIEWS_QUERY_KEY } from './useReviews'

export function useCreateReview() {
  const queryClient = useQueryClient()
  const { addReview } = useStore()

  return useMutation({
    mutationFn: (data: CreateReviewDTO) => services.reviews.create(data),
    onSuccess: (newReview) => {
      addReview(newReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  const { updateReview } = useStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewDTO }) =>
      services.reviews.update(id, data),
    onSuccess: (updatedReview) => {
      updateReview(updatedReview.id, updatedReview)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  const { removeReview } = useStore()

  return useMutation({
    mutationFn: (id: string) => services.reviews.delete(id),
    onSuccess: (_, id) => {
      removeReview(id)
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY })
    },
  })
}
```

**Step 3: Crear barrel `src/features/reviews/hooks/index.ts`**

```typescript
// src/features/reviews/hooks/index.ts
export { useReviews, useReviewsByContent, REVIEWS_QUERY_KEY } from './useReviews'
export { useCreateReview, useUpdateReview, useDeleteReview } from './useReviewMutations'
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 5: Commit**

```bash
git add src/features/reviews/hooks/
git commit -m "feat: add review query hooks with TanStack Query"
```

---

## Task 6: Componentes atómicos compartidos para reviews

Crear los átomos UI que usan las features de reviews. Todos van en `src/shared/ui/atoms/`.

**Files:**
- Create: `src/shared/ui/atoms/RatingStars.tsx`
- Create: `src/shared/ui/atoms/ContentTypeBadge.tsx`
- Create: `src/shared/ui/atoms/StatusBadge.tsx`
- Create: `src/shared/ui/atoms/EmptyState.tsx`
- Create: `src/shared/ui/atoms/index.ts`

**Step 1: Crear `src/shared/ui/atoms/RatingStars.tsx`**

```tsx
// src/shared/ui/atoms/RatingStars.tsx
'use client'

import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rating } from '@/shared/types'

interface RatingStarsProps {
  value?: Rating
  onChange?: (rating: Rating) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-3', md: 'size-4', lg: 'size-5' }

export function RatingStars({ value, onChange, readonly = false, size = 'md' }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5] as Rating[]).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          aria-label={`Rate ${star} out of 5`}
        >
          <StarIcon
            className={cn(
              sizes[size],
              value && star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Crear `src/shared/ui/atoms/ContentTypeBadge.tsx`**

```tsx
// src/shared/ui/atoms/ContentTypeBadge.tsx
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'

interface ContentTypeBadgeProps {
  contentType: ContentType
  showIcon?: boolean
  className?: string
}

export function ContentTypeBadge({ contentType, showIcon = true, className }: ContentTypeBadgeProps) {
  const label = CONTENT_TYPE_LABELS[contentType]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      {showIcon && <span aria-hidden>{label.icon}</span>}
      <span>{label.en}</span>
    </span>
  )
}
```

**Step 3: Crear `src/shared/ui/atoms/StatusBadge.tsx`**

```tsx
// src/shared/ui/atoms/StatusBadge.tsx
import { cn } from '@/lib/utils'
import { CONSUMPTION_STATUS_LABELS } from '@/shared/types'
import type { ConsumptionStatus, ContentType } from '@/shared/types'

interface StatusBadgeProps {
  status: ConsumptionStatus
  contentType: ContentType
  className?: string
}

const statusColors: Record<ConsumptionStatus, string> = {
  consumed:        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  want_to_consume: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  consuming:       'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  dropped:         'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
}

export function StatusBadge({ status, contentType, className }: StatusBadgeProps) {
  const label = CONSUMPTION_STATUS_LABELS[status][contentType].en
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        statusColors[status],
        className
      )}
    >
      {label}
    </span>
  )
}
```

**Step 4: Crear `src/shared/ui/atoms/EmptyState.tsx`**

```tsx
// src/shared/ui/atoms/EmptyState.tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

**Step 5: Crear barrel `src/shared/ui/atoms/index.ts`**

```typescript
// src/shared/ui/atoms/index.ts
export { RatingStars } from './RatingStars'
export { ContentTypeBadge } from './ContentTypeBadge'
export { StatusBadge } from './StatusBadge'
export { EmptyState } from './EmptyState'
```

**Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 7: Commit**

```bash
git add src/shared/ui/atoms/
git commit -m "feat: add shared atomic UI components - RatingStars, ContentTypeBadge, StatusBadge, EmptyState"
```

---

## Task 7: Formulario de creación/edición de review (ReviewForm)

El formulario de review usa react-hook-form + Zod 4 para validación. Es el corazón del CRUD.

**Files:**
- Install: `react-hook-form`, `@hookform/resolvers`
- Create: `src/features/reviews/components/ReviewForm.tsx`
- Create: `src/features/reviews/types.ts` — tipos locales de la feature

**Step 1: Instalar react-hook-form y resolvers**

```bash
bun add react-hook-form @hookform/resolvers
```

**Step 2: Verificar instalación**

```bash
node -e "require('react-hook-form'); require('@hookform/resolvers/zod'); console.log('ok')"
```

Expected: `ok`

**Step 3: Agregar shadcn form component**

El componente `form` de shadcn envuelve react-hook-form con accesibilidad y estilos:

```bash
bunx shadcn@latest add form
```

**Step 4: Agregar shadcn select, textarea, label**

```bash
bunx shadcn@latest add select textarea label
```

**Step 5: Crear `src/features/reviews/types.ts`**

```typescript
// src/features/reviews/types.ts
import type { Review } from '@/entities/review/types'

// Para el formulario — campos editables
export interface ReviewFormValues {
  contentId: string
  contentType: 'movie' | 'series' | 'music' | 'game' | 'book' | 'podcast'
  rating?: 1 | 2 | 3 | 4 | 5
  title?: string
  body?: string
  containsSpoilers: boolean
  status: 'consumed' | 'want_to_consume' | 'consuming' | 'dropped'
}

// Modo del formulario
export type ReviewFormMode = 'create' | 'edit'

// Props del componente
export interface ReviewFormProps {
  mode: ReviewFormMode
  initialValues?: Partial<ReviewFormValues>
  review?: Review  // solo en modo edit
  onSuccess?: (review: Review) => void
  onCancel?: () => void
}
```

**Step 6: Crear `src/features/reviews/components/ReviewForm.tsx`**

```tsx
// src/features/reviews/components/ReviewForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RatingStars } from '@/shared/ui/atoms'
import { useUser } from '@/shared/lib/store'
import { useCreateReview, useUpdateReview } from '../hooks'
import type { ReviewFormProps, ReviewFormValues } from '../types'
import type { Rating } from '@/shared/types'

const reviewFormSchema = z.object({
  contentId:        z.string().min(1, 'Content is required'),
  contentType:      z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast']),
  rating:           z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  title:            z.string().max(100).optional(),
  body:             z.string().max(2000).optional(),
  containsSpoilers: z.boolean(),
  status:           z.enum(['consumed', 'want_to_consume', 'consuming', 'dropped']),
})

export function ReviewForm({ mode, initialValues, review, onSuccess, onCancel }: ReviewFormProps) {
  const user = useUser()
  const createReview = useCreateReview()
  const updateReview = useUpdateReview()

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      contentId:        initialValues?.contentId ?? review?.contentId ?? '',
      contentType:      initialValues?.contentType ?? review?.contentType ?? 'movie',
      rating:           initialValues?.rating ?? review?.rating,
      title:            initialValues?.title ?? review?.title ?? '',
      body:             initialValues?.body ?? review?.body ?? '',
      containsSpoilers: initialValues?.containsSpoilers ?? review?.containsSpoilers ?? false,
      status:           initialValues?.status ?? review?.status ?? 'consumed',
    },
  })

  const isLoading = createReview.isPending || updateReview.isPending

  async function onSubmit(values: ReviewFormValues) {
    if (!user) return

    if (mode === 'create') {
      const result = await createReview.mutateAsync({
        ...values,
        userId: user.id,
      })
      onSuccess?.(result)
    } else if (mode === 'edit' && review) {
      const result = await updateReview.mutateAsync({
        id: review.id,
        data: values,
      })
      onSuccess?.(result)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Content Type */}
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="movie">🎬 Movie</SelectItem>
                  <SelectItem value="series">📺 Series</SelectItem>
                  <SelectItem value="music">🎵 Music</SelectItem>
                  <SelectItem value="game">🎮 Game</SelectItem>
                  <SelectItem value="book">📚 Book</SelectItem>
                  <SelectItem value="podcast">🎙️ Podcast</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="consumed">Consumed</SelectItem>
                  <SelectItem value="want_to_consume">Want to consume</SelectItem>
                  <SelectItem value="consuming">Currently consuming</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingStars
                  value={field.value}
                  onChange={(r: Rating) => field.onChange(r)}
                  size="lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="Give your review a title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Body */}
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review <span className="text-muted-foreground">(optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your thoughts..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Add Review' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 8: Commit**

```bash
git add src/features/reviews/ src/components/ui/form.tsx src/components/ui/select.tsx src/components/ui/textarea.tsx src/components/ui/label.tsx
git commit -m "feat: add ReviewForm with react-hook-form and zod validation"
```

---

## Task 8: ReviewCard — tarjeta de review para el listado

**Files:**
- Create: `src/features/reviews/components/ReviewCard.tsx`

**Step 1: Crear `src/features/reviews/components/ReviewCard.tsx`**

```tsx
// src/features/reviews/components/ReviewCard.tsx
'use client'

import { PencilIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { formatDate } from '@/shared/utils'
import type { Review } from '@/entities/review/types'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (review: Review) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ContentTypeBadge contentType={review.contentType} />
          <StatusBadge status={review.status} contentType={review.contentType} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(review)}
              aria-label="Edit review"
            >
              <PencilIcon />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(review)}
              aria-label="Delete review"
              className="text-destructive hover:text-destructive"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>

      {/* Rating */}
      {review.rating && <RatingStars value={review.rating} readonly size="sm" />}

      {/* Title */}
      {review.title && (
        <p className="font-medium text-sm leading-snug">{review.title}</p>
      )}

      {/* Body */}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {review.body}
        </p>
      )}

      {/* Footer */}
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>ID: <code className="font-mono">{review.contentId}</code></span>
        <span>{formatDate(review.createdAt)}</span>
      </div>
    </div>
  )
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 3: Commit**

```bash
git add src/features/reviews/components/ReviewCard.tsx
git commit -m "feat: add ReviewCard component"
```

---

## Task 9: ReviewList — listado completo de reviews con CRUD

Ensamblar todo en la vista de listado. Incluye estado vacío, diálogo de confirmación de borrado, y sheet lateral para crear/editar.

**Files:**
- Install: shadcn `dialog` (para confirmación de borrado) — ya puede estar instalado como dependencia del sidebar
- Create: `src/features/reviews/components/ReviewList.tsx`
- Modify: `src/app/(app)/reviews/page.tsx` — usar ReviewList

**Step 1: Agregar shadcn dialog**

```bash
bunx shadcn@latest add dialog
```

**Step 2: Crear `src/features/reviews/components/ReviewList.tsx`**

```tsx
// src/features/reviews/components/ReviewList.tsx
'use client'

import { useState } from 'react'
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
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
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

**Step 3: Modificar `src/app/(app)/reviews/page.tsx`** — usar ReviewList

```tsx
// src/app/(app)/reviews/page.tsx
import { ReviewList } from '@/features/reviews/components/ReviewList'

export default function ReviewsPage() {
  return <ReviewList />
}
```

**Step 4: Crear barrel de componentes de la feature**

Crear `src/features/reviews/components/index.ts`:

```typescript
// src/features/reviews/components/index.ts
export { ReviewCard } from './ReviewCard'
export { ReviewForm } from './ReviewForm'
export { ReviewList } from './ReviewList'
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 6: Commit**

```bash
git add src/features/reviews/ src/app/(app)/reviews/ src/components/ui/dialog.tsx
git commit -m "feat: add ReviewList with full CRUD - create, edit, delete with confirmation"
```

---

## Task 10: Header con breadcrumb en el layout de la app

El layout del app shell necesita un header que muestre el breadcrumb de la página actual. Se agrega a `(app)/layout.tsx`.

**Files:**
- Create: `src/components/AppHeader.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Step 1: Crear `src/components/AppHeader.tsx`**

```tsx
// src/components/AppHeader.tsx
'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ROUTES } from '@/shared/constants'

const routeLabels: Record<string, string> = {
  [ROUTES.MOVIES]:  'Movies',
  [ROUTES.SERIES]:  'Series',
  [ROUTES.REVIEWS]: 'My Reviews',
  [ROUTES.GROUPS]:  'Groups',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.HOME]:    'Home',
}

export function AppHeader() {
  const pathname = usePathname()
  const label = routeLabels[pathname] ?? 'Things Review'
  const isHome = pathname === ROUTES.HOME

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 data-vertical:h-4 data-vertical:self-auto" />
      <Breadcrumb>
        <BreadcrumbList>
          {!isHome && (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={ROUTES.HOME}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
```

**Step 2: Modificar `src/app/(app)/layout.tsx`** para incluir el header

```tsx
// src/app/(app)/layout.tsx
'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/AppHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useInitDevUser } from '@/shared/hooks/useInitDevUser'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitDevUser()

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

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

**Step 4: Commit final del sprint**

```bash
git add -A
git commit -m "feat: add AppHeader with breadcrumb to app shell layout"
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

Expected: Ver los commits de cada task.

**Step 3: Verificar estructura de features**

```bash
find src/features src/shared/ui/atoms src/app/\(app\) -type f | sort
```

Expected:
```
src/app/(app)/groups/page.tsx
src/app/(app)/layout.tsx
src/app/(app)/movies/page.tsx
src/app/(app)/page.tsx
src/app/(app)/profile/page.tsx
src/app/(app)/reviews/page.tsx
src/app/(app)/series/page.tsx
src/features/reviews/components/ReviewCard.tsx
src/features/reviews/components/ReviewForm.tsx
src/features/reviews/components/ReviewList.tsx
src/features/reviews/components/index.ts
src/features/reviews/hooks/index.ts
src/features/reviews/hooks/useReviewMutations.ts
src/features/reviews/hooks/useReviews.ts
src/features/reviews/types.ts
src/shared/ui/atoms/ContentTypeBadge.tsx
src/shared/ui/atoms/EmptyState.tsx
src/shared/ui/atoms/RatingStars.tsx
src/shared/ui/atoms/StatusBadge.tsx
src/shared/ui/atoms/index.ts
```
