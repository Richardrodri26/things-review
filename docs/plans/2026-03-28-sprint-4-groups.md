# Sprint 4 — Groups Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la feature de Groups completa: listar grupos del usuario, crear un grupo, ver el detalle de un grupo con sus reviews, y unirse a un grupo por invite code.

**Architecture:** Feature-Sliced Design. Todo vive en `src/features/groups/`. El estado de grupos se carga al store Zustand desde localStorage via TanStack Query al entrar al layout `(app)`. Las rutas son `ROUTES.GROUPS` (`/groups`) y `ROUTES.GROUP_DETAIL(id)` (`/groups/[id]`). El grupo ya existe en `src/app/(app)/groups/page.tsx` (placeholder) y la ruta dinámica `src/app/(app)/groups/[id]/` hay que crearla. El estado de filtros es local al componente (YAGNI).

**Tech Stack:** Next.js 16 App Router, shadcn/ui (Base UI / base-mira), Zustand 5 + Immer, TanStack Query v5, TanStack Form v1, Zod 4, TypeScript strict, Tailwind 4. Package manager: `bun`.

---

## Contexto del proyecto

**Servicios disponibles (`src/shared/services/`):**
- `services.groups.getAll()` → `Promise<Group[]>`
- `services.groups.getById(id)` → `Promise<Group | null>`
- `services.groups.getByInviteCode(code)` → `Promise<Group | null>`
- `services.groups.create(data: CreateGroupDTO, ownerId: string)` → `Promise<Group>`
- `services.groups.update(id, data: UpdateGroupDTO)` → `Promise<Group>`
- `services.groups.delete(id)` → `Promise<void>`
- `services.groups.getMemberships(userId)` → `Promise<GroupMembership[]>`
- `services.groups.addMember(groupId, userId, role?)` → `Promise<GroupMembership>`
- `services.groups.removeMember(groupId, userId)` → `Promise<void>`
- `services.groups.getMemberIds(groupId)` → `Promise<string[]>`
- `services.reviews.getByUserId(userId)` → `Promise<Review[]>`

**Store Zustand (`src/shared/lib/store/index.ts`):**
- `useUser()` → selector del usuario actual
- `useGroups()` → selector de la lista de grupos en memoria
- `useStore((s) => s.setGroups)` → acción para setear grupos
- `useStore((s) => s.addGroup)` → acción para agregar un grupo
- `useStore((s) => s.updateGroup)` → acción para actualizar un grupo
- `useStore((s) => s.removeGroup)` → acción para eliminar un grupo
- `useStore((s) => s.reviews)` → reviews del usuario en memoria

**Tipos relevantes (`src/entities/group/types.ts`):**
- `Group` — `{ id, name, description?, avatarUrl?, visibility, inviteCode, ownerId, memberIds, focusContentTypes?, createdAt, updatedAt }`
- `GroupMembership` — `{ userId, groupId, role: GroupRole, joinedAt }`
- `CreateGroupDTO` — `Omit<Group, 'id' | 'inviteCode' | 'memberIds' | 'createdAt' | 'updatedAt'>`
- `UpdateGroupDTO` — `Partial<Pick<Group, 'name' | 'description' | 'avatarUrl' | 'visibility' | 'focusContentTypes'>>`
- `GroupVisibility` — `'public' | 'private'`
- `GroupRole` — `'owner' | 'admin' | 'member'`

**Tipos relevantes (`src/shared/types/index.ts`):**
- `ContentType` — `'movie' | 'series' | 'music' | 'game' | 'book' | 'podcast'`
- `CONTENT_TYPE_LABELS` — `Record<ContentType, { en, es, icon }>`

**Patrones TanStack Form v1 — OBLIGATORIO leer antes de escribir formularios:**

NO pasar genérico explícito: ~~`useForm<MyType>({})`~~ — provoca error TypeScript "Expected 12 type args".
CORRECTO: dejar que TypeScript infiera desde `defaultValues`:
```typescript
type FormData = z.input<typeof schema>
const defaultValues: FormData = { ... }
const form = useForm({ defaultValues, ... })
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

`form.Subscribe` necesita `as const`:
```typescript
<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
```

**Rutas actuales (`ROUTES`):**
```typescript
ROUTES.GROUPS = '/groups'
ROUTES.GROUP_DETAIL = (id: string) => `/groups/${id}`
```

`GROUP_DETAIL` ya existe en las constantes.

**Lo que hay que crear/reemplazar:**
- `src/app/(app)/groups/page.tsx` — actualmente es placeholder. Reemplazar.
- `src/app/(app)/groups/[id]/page.tsx` — no existe. Crear.
- `src/features/groups/` — no existe. Crear toda la feature.

**Patrón de hooks existente para referencia** (ver `src/features/reviews/hooks/`):
- `useReviews.ts` — `useQuery` con `initialData` desde store
- `useReviewMutations.ts` — `useMutation` que sincroniza store + query cache en `onSuccess`

---

## Task 1: Query hooks de grupos

Crear los hooks de TanStack Query para grupos. Mismo patrón que `src/features/reviews/hooks/`.

**Files:**
- Create: `src/features/groups/hooks/useGroups.ts`
- Create: `src/features/groups/hooks/useGroupMutations.ts`
- Create: `src/features/groups/hooks/index.ts`

**Step 1: Crear `src/features/groups/hooks/useGroups.ts`**

```typescript
// src/features/groups/hooks/useGroups.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser, useGroups as useGroupsStore } from '@/shared/lib/store'
import { useStore } from '@/shared/lib/store'

export const GROUPS_QUERY_KEY = ['groups'] as const

export function useGroups() {
  const user = useUser()
  const groups = useGroupsStore()
  const setGroups = useStore((s) => s.setGroups)

  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: async () => {
      const all = await services.groups.getAll()
      setGroups(all)
      return all
    },
    enabled: !!user,
    initialData: groups.length > 0 ? groups : undefined,
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: [...GROUPS_QUERY_KEY, id] as const,
    queryFn: () => services.groups.getById(id),
    enabled: !!id,
  })
}
```

**Step 2: Crear `src/features/groups/hooks/useGroupMutations.ts`**

```typescript
// src/features/groups/hooks/useGroupMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { useUser } from '@/shared/lib/store'
import type { CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import { GROUPS_QUERY_KEY } from './useGroups'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const addGroup = useStore((s) => s.addGroup)
  const user = useUser()

  return useMutation({
    mutationFn: (data: CreateGroupDTO) => {
      if (!user) throw new Error('No user')
      return services.groups.create(data, user.id)
    },
    onSuccess: (newGroup) => {
      addGroup(newGroup)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  const updateGroup = useStore((s) => s.updateGroup)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDTO }) =>
      services.groups.update(id, data),
    onSuccess: (updatedGroup) => {
      updateGroup(updatedGroup.id, updatedGroup)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  const removeGroup = useStore((s) => s.removeGroup)

  return useMutation({
    mutationFn: (id: string) => services.groups.delete(id),
    onSuccess: (_, id) => {
      removeGroup(id)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()
  const addGroup = useStore((s) => s.addGroup)
  const user = useUser()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('No user')
      const group = await services.groups.getByInviteCode(inviteCode)
      if (!group) throw new Error('Invalid invite code')
      await services.groups.addMember(group.id, user.id)
      return group
    },
    onSuccess: (group) => {
      addGroup(group)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}
```

**Step 3: Crear barrel `src/features/groups/hooks/index.ts`**

```typescript
// src/features/groups/hooks/index.ts
export { useGroups, useGroup, GROUPS_QUERY_KEY } from './useGroups'
export { useCreateGroup, useUpdateGroup, useDeleteGroup, useJoinGroup } from './useGroupMutations'
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 5: Commit**

```bash
git add src/features/groups/hooks/
git commit -m "feat: add group query hooks"
```

---

## Task 2: GroupForm — formulario de creación de grupo

Formulario para crear un grupo nuevo: nombre, descripción (opcional), visibilidad (pública/privada), y content types de foco (opcional, checkboxes).

**Files:**
- Create: `src/features/groups/components/GroupForm.tsx`

**Step 1: Instalar shadcn `checkbox`**

```bash
bunx shadcn@latest add checkbox --yes
```

Expected: `src/components/ui/checkbox.tsx` creado.

**Step 2: Crear `src/features/groups/components/GroupForm.tsx`**

```tsx
// src/features/groups/components/GroupForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'
import { useCreateGroup } from '../hooks'

const CONTENT_TYPE_LIST: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

const groupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
  visibility: z.enum(['public', 'private']),
  focusContentTypes: z.array(z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast'])).optional(),
})

type FormData = z.input<typeof groupSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

interface GroupFormProps {
  onSuccess?: (groupId: string) => void
  onCancel?: () => void
}

export function GroupForm({ onSuccess, onCancel }: GroupFormProps) {
  const createGroup = useCreateGroup()

  const defaultValues: FormData = {
    name: '',
    description: '',
    visibility: 'public',
    focusContentTypes: [],
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: groupSchema },
    onSubmit: async ({ value }) => {
      const group = await createGroup.mutateAsync({
        name: value.name,
        description: value.description || undefined,
        visibility: value.visibility,
        focusContentTypes: value.focusContentTypes?.length ? value.focusContentTypes : undefined,
        ownerId: '', // se sobreescribe en el servicio con el userId real
      })
      onSuccess?.(group.id)
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
      {/* Name */}
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Group Name</Label>
            <Input
              id={field.name}
              placeholder="e.g. Weekend Movie Club"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoFocus
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              placeholder="What's this group about?"
              className="resize-none"
              rows={2}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Visibility */}
      <form.Field name="visibility">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Visibility</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as 'public' | 'private')}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">🌍 Public</SelectItem>
                <SelectItem value="private">🔒 Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* Focus Content Types */}
      <form.Field name="focusContentTypes">
        {(field) => (
          <div className="space-y-2">
            <Label>
              Focus Types <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONTENT_TYPE_LIST.map((ct) => {
                const label = CONTENT_TYPE_LABELS[ct]
                const checked = (field.state.value ?? []).includes(ct)
                return (
                  <label
                    key={ct}
                    className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const current = field.state.value ?? []
                        field.handleChange(
                          v ? [...current, ct] : current.filter((c) => c !== ct)
                        )
                      }}
                    />
                    <span className="text-sm">
                      {label.icon} {label.en}
                    </span>
                  </label>
                )
              })}
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/groups/components/GroupForm.tsx src/components/ui/checkbox.tsx
git commit -m "feat: add GroupForm component"
```

---

## Task 3: JoinGroupForm — formulario para unirse con invite code

Formulario minimalista: un campo de texto para el invite code. Al enviar, llama a `useJoinGroup` que busca el grupo por código y agrega al usuario como miembro.

**Files:**
- Create: `src/features/groups/components/JoinGroupForm.tsx`

**Step 1: Crear `src/features/groups/components/JoinGroupForm.tsx`**

```tsx
// src/features/groups/components/JoinGroupForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useJoinGroup } from '../hooks'

const joinSchema = z.object({
  inviteCode: z
    .string()
    .min(1, 'Invite code is required')
    .max(20, 'Invalid invite code'),
})

type FormData = z.input<typeof joinSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

interface JoinGroupFormProps {
  onSuccess?: (groupId: string) => void
  onCancel?: () => void
}

export function JoinGroupForm({ onSuccess, onCancel }: JoinGroupFormProps) {
  const joinGroup = useJoinGroup()

  const defaultValues: FormData = { inviteCode: '' }

  const form = useForm({
    defaultValues,
    validators: { onChange: joinSchema },
    onSubmit: async ({ value }) => {
      const group = await joinGroup.mutateAsync(value.inviteCode.trim())
      onSuccess?.(group.id)
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
      <form.Field name="inviteCode">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Invite Code</Label>
            <Input
              id={field.name}
              placeholder="Enter invite code..."
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoFocus
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
            {joinGroup.isError && (
              <p className="text-xs text-destructive">Invalid invite code. Please try again.</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Group'}
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

Expected: Sin errores.

**Step 3: Commit**

```bash
git add src/features/groups/components/JoinGroupForm.tsx
git commit -m "feat: add JoinGroupForm component"
```

---

## Task 4: GroupCard — card visual para un grupo en el listado

Componente atómico que muestra nombre, descripción, miembros, visibilidad y badge de owner/member.

**Files:**
- Create: `src/features/groups/components/GroupCard.tsx`

**Step 1: Instalar shadcn `badge`**

```bash
bunx shadcn@latest add badge --yes
```

Expected: `src/components/ui/badge.tsx` creado.

**Step 2: Crear `src/features/groups/components/GroupCard.tsx`**

```tsx
// src/features/groups/components/GroupCard.tsx
import Link from 'next/link'
import { UsersIcon, LockIcon, GlobeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { ROUTES } from '@/shared/constants'
import type { Group } from '@/entities/group/types'

interface GroupCardProps {
  group: Group
  isOwner: boolean
}

export function GroupCard({ group, isOwner }: GroupCardProps) {
  return (
    <Link
      href={ROUTES.GROUP_DETAIL(group.id)}
      className="block rounded-lg border border-border bg-card p-4 space-y-3 hover:bg-muted/40 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug truncate">{group.name}</h3>
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwner && (
            <Badge variant="secondary" className="text-[10px]">Owner</Badge>
          )}
          {group.visibility === 'private' ? (
            <LockIcon className="size-3.5 text-muted-foreground" />
          ) : (
            <GlobeIcon className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Focus types */}
      {group.focusContentTypes && group.focusContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.focusContentTypes.map((ct) => (
            <span key={ct} className="text-base" title={CONTENT_TYPE_LABELS[ct].en} aria-label={CONTENT_TYPE_LABELS[ct].en}>
              {CONTENT_TYPE_LABELS[ct].icon}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <UsersIcon className="size-3.5" />
        <span>{group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}</span>
      </div>
    </Link>
  )
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 4: Commit**

```bash
git add src/features/groups/components/GroupCard.tsx src/components/ui/badge.tsx
git commit -m "feat: add GroupCard component"
```

---

## Task 5: GroupsPage — listado de grupos del usuario

Implementar `src/app/(app)/groups/page.tsx`. Muestra los grupos del usuario con dos acciones en el header: "Create Group" y "Join Group". Si no tiene grupos, muestra un `EmptyState`. Ambas acciones abren un Dialog con su formulario correspondiente.

**Files:**
- Create: `src/features/groups/components/GroupsPage.tsx`
- Create: `src/features/groups/components/index.ts`
- Modify: `src/app/(app)/groups/page.tsx`

**Step 1: Crear `src/features/groups/components/GroupsPage.tsx`**

```tsx
// src/features/groups/components/GroupsPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, UsersIcon, KeyRoundIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import { useUser } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'
import { useGroups } from '../hooks'
import { GroupCard } from './GroupCard'
import { GroupForm } from './GroupForm'
import { JoinGroupForm } from './JoinGroupForm'

type DialogMode = 'none' | 'create' | 'join'

export function GroupsPage() {
  const router = useRouter()
  const user = useUser()
  const { data: groups = [], isLoading } = useGroups()
  const [dialog, setDialog] = useState<DialogMode>('none')

  function handleGroupCreated(groupId: string) {
    setDialog('none')
    router.push(ROUTES.GROUP_DETAIL(groupId))
  }

  function handleGroupJoined(groupId: string) {
    setDialog('none')
    router.push(ROUTES.GROUP_DETAIL(groupId))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Groups</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialog('join')}>
            <KeyRoundIcon />
            Join
          </Button>
          <Button size="sm" onClick={() => setDialog('create')}>
            <PlusIcon />
            Create Group
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-6" />}
          title="No groups yet"
          description="Create a group or join one with an invite code."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialog('join')}>
                <KeyRoundIcon />
                Join with code
              </Button>
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                Create Group
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isOwner={group.ownerId === user?.id}
            />
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <GroupForm
            onSuccess={handleGroupCreated}
            onCancel={() => setDialog('none')}
          />
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={dialog === 'join'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join a Group</DialogTitle>
          </DialogHeader>
          <JoinGroupForm
            onSuccess={handleGroupJoined}
            onCancel={() => setDialog('none')}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 2: Crear barrel `src/features/groups/components/index.ts`**

```typescript
// src/features/groups/components/index.ts
export { GroupCard } from './GroupCard'
export { GroupForm } from './GroupForm'
export { GroupsPage } from './GroupsPage'
export { JoinGroupForm } from './JoinGroupForm'
```

**Step 3: Reemplazar `src/app/(app)/groups/page.tsx`**

```tsx
// src/app/(app)/groups/page.tsx
import { GroupsPage } from '@/features/groups/components'

export default function GroupsRoute() {
  return <GroupsPage />
}
```

**Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 5: Commit**

```bash
git add src/features/groups/components/ src/app/(app)/groups/page.tsx
git commit -m "feat: add groups list page with create and join dialogs"
```

---

## Task 6: GroupDetailPage — detalle del grupo con reviews compartidas

Página `src/app/(app)/groups/[id]/page.tsx`. Muestra:
1. **Header** — nombre del grupo, descripción, miembros, invite code (solo para el owner), visibilidad.
2. **Reviews section** — las reviews del usuario actual que pertenecen a este grupo (todas las del usuario, ya que en este modelo las reviews son personales pero se comparten en grupos). Se reusa el `ReviewCard` existente en modo read-only (sin botones de editar/borrar).

**Nota de arquitectura:** En este modelo local de Sprint 4, "las reviews del grupo" son las reviews propias del usuario. No hay reviews de otros miembros porque la app es single-user (localStorage). La sección de reviews muestra las reviews del usuario como su contribución al grupo.

**Files:**
- Create: `src/features/groups/components/GroupDetailPage.tsx`
- Create: `src/app/(app)/groups/[id]/page.tsx`

**Step 1: Instalar shadcn `tooltip`**

`tooltip` ya existe en `src/components/ui/tooltip.tsx`. Skipear este paso.

**Step 2: Crear `src/features/groups/components/GroupDetailPage.tsx`**

```tsx
// src/features/groups/components/GroupDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  UsersIcon,
  LockIcon,
  GlobeIcon,
  TrashIcon,
  StarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { useUser } from '@/shared/lib/store'
import { useStore } from '@/shared/lib/store'
import { ROUTES, CONTENT_TYPE_LABELS } from '@/shared/constants'
import { useGroup, useDeleteGroup } from '../hooks'

interface GroupDetailPageProps {
  groupId: string
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const router = useRouter()
  const user = useUser()
  const reviews = useStore((s) => s.reviews)
  const { data: group, isLoading } = useGroup(groupId)
  const deleteGroup = useDeleteGroup()
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          Back
        </Button>
        <p className="text-muted-foreground">Group not found.</p>
      </div>
    )
  }

  const isOwner = group.ownerId === user?.id

  function copyInviteCode() {
    navigator.clipboard.writeText(group!.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    await deleteGroup.mutateAsync(group!.id)
    router.replace(ROUTES.GROUPS)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit -ml-2">
        <ArrowLeftIcon />
        Groups
      </Button>

      {/* Group Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{group.name}</h1>
            <div className="flex items-center gap-1.5">
              {isOwner && <Badge variant="secondary">Owner</Badge>}
              {group.visibility === 'private' ? (
                <LockIcon className="size-4 text-muted-foreground" />
              ) : (
                <GlobeIcon className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <UsersIcon className="size-3.5" />
            <span>{group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}</span>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDelete(true)}
            className="text-destructive hover:text-destructive shrink-0"
            aria-label="Delete group"
          >
            <TrashIcon />
          </Button>
        )}
      </div>

      {/* Focus types */}
      {group.focusContentTypes && group.focusContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {group.focusContentTypes.map((ct) => (
            <span
              key={ct}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {CONTENT_TYPE_LABELS[ct].icon} {CONTENT_TYPE_LABELS[ct].en}
            </span>
          ))}
        </div>
      )}

      {/* Invite Code (owner only) */}
      {isOwner && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invite Code</p>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono tracking-widest">
                {group.inviteCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Reviews Section */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          My Reviews
        </h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon={<StarIcon className="size-6" />}
            title="No reviews yet"
            description="Add reviews from the Reviews page to share with this group."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              This will permanently delete "{group.name}" and all its memberships. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Nota importante:** `CONTENT_TYPE_LABELS` está en `@/shared/types`, no en `@/shared/constants`. El import correcto es:
```typescript
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { ROUTES } from '@/shared/constants'
```
El código de arriba tiene un import erróneo combinado — usar los dos imports separados.

**Step 3: Crear `src/app/(app)/groups/[id]/page.tsx`**

```tsx
// src/app/(app)/groups/[id]/page.tsx
import { GroupDetailPage } from '@/features/groups/components'

interface GroupDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailRoute({ params }: GroupDetailRouteProps) {
  const { id } = await params
  return <GroupDetailPage groupId={id} />
}
```

> **Nota Next.js 16:** `params` es una `Promise` en Next.js 15+. Hay que hacer `await params` en Server Components. `GroupDetailPage` es Client Component por el `'use client'` y recibe `groupId` como prop string.

**Step 4: Actualizar barrel de components**

En `src/features/groups/components/index.ts`, agregar la export:

```typescript
// src/features/groups/components/index.ts
export { GroupCard } from './GroupCard'
export { GroupDetailPage } from './GroupDetailPage'
export { GroupForm } from './GroupForm'
export { GroupsPage } from './GroupsPage'
export { JoinGroupForm } from './JoinGroupForm'
```

**Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1
```

Expected: Sin errores.

**Step 6: Commit**

```bash
git add src/features/groups/components/GroupDetailPage.tsx "src/app/(app)/groups/[id]/"
git commit -m "feat: add group detail page with invite code and reviews"
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
feat: add group detail page with invite code and reviews
feat: add groups list page with create and join dialogs
feat: add GroupCard component
feat: add JoinGroupForm component
feat: add GroupForm component
feat: add group query hooks
feat: add content type and status filters to ReviewList  ← último de Sprint 3
```

**Step 3: Verificar estructura nueva del sprint**

```bash
find src/features/groups "src/app/(app)/groups" -type f | sort
```

Expected:
```
src/app/(app)/groups/[id]/page.tsx
src/app/(app)/groups/page.tsx
src/features/groups/components/GroupCard.tsx
src/features/groups/components/GroupDetailPage.tsx
src/features/groups/components/GroupForm.tsx
src/features/groups/components/GroupsPage.tsx
src/features/groups/components/JoinGroupForm.tsx
src/features/groups/components/index.ts
src/features/groups/hooks/index.ts
src/features/groups/hooks/useGroupMutations.ts
src/features/groups/hooks/useGroups.ts
```
