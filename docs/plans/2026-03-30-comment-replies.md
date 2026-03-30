# Comment Replies (Threaded — 1 Level) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que los usuarios respondan comentarios en un hilo de un solo nivel (comentario raíz → N replies), con UX estilo GitHub/Linear — replies siempre visibles, indentadas, con un botón "Reply" en cada comentario raíz.

**Architecture:** Se agrega `parentId: string | null` al modelo `Comment`. El `LocalCommentService` agrupa los comentarios en memoria al leerlos. `CommentList` renderiza los comentarios raíz y pasa sus replies a cada `CommentCard`. `CommentCard` muestra las replies indentadas debajo del body. Un inline `ReplyForm` (reutiliza la lógica de `CommentForm`) se activa con el botón "Reply".

**Tech Stack:** Next.js, React, TypeScript, TanStack Query, TanStack Form, Zod, Tailwind CSS, localStorage via `LocalCommentService`

---

> ⚠️ **Decisión de diseño — 1 solo nivel (intencional)**
>
> El modelo soporta `parentId: string | null`. Actualmente solo se permiten replies a comentarios raíz (`parentId === null`).
> Las replies NO pueden tener replies — `CommentCard` solo renderiza el formulario de reply cuando `depth === 0`.
>
> **Para escalar a hilos infinitos en el futuro:**
> 1. Cambiar `depth === 0` por una prop `maxDepth` (ej: `maxDepth={5}`)
> 2. El service `getByReviewId` ya devuelve todos los comentarios planos — solo cambia la función `buildTree()` para que sea recursiva
> 3. Agregar paginación de replies (lazy load) si los hilos crecen mucho
> 4. Considerar mover `parentId` a un índice en la BD para queries eficientes

---

## File Map

| Acción | Archivo | Qué cambia |
|--------|---------|------------|
| Modify | `src/entities/comment/types.ts` | Agrega `parentId: string \| null` |
| Modify | `src/entities/comment/schema.ts` | Agrega `parentId` al schema Zod |
| Modify | `src/shared/services/comment.service.ts` | `getByReviewId` devuelve `CommentThread[]`; interface `ICommentService` actualizada |
| Modify | `src/features/comments/hooks/useComments.ts` | Tipado actualizado para `CommentThread` |
| Create | `src/features/comments/components/ReplyForm.tsx` | Formulario inline de reply (adapta `CommentForm`) |
| Modify | `src/features/comments/components/CommentCard.tsx` | Muestra replies indentadas + botón Reply + toggle del form |
| Modify | `src/features/comments/components/CommentList.tsx` | Pasa `replies` a cada `CommentCard` |
| Modify | `src/features/comments/components/CommentForm.tsx` | Acepta prop opcional `parentId` |

---

## Task 1: Actualizar el modelo de datos

**Files:**
- Modify: `src/entities/comment/types.ts`
- Modify: `src/entities/comment/schema.ts`

- [ ] **Step 1: Actualizar `types.ts`**

Reemplazar el contenido completo de `src/entities/comment/types.ts`:

```ts
// entities/comment/types.ts
import type { User } from '@/entities/user/types'

export interface Comment {
  id: string
  reviewId: string
  groupId: string
  authorId: string
  body: string
  /**
   * ID del comentario padre. `null` = comentario raíz.
   * Actualmente solo se soporta 1 nivel de profundidad (replies a raíces).
   * Ver docs/plans/2026-03-30-comment-replies.md para escalar a hilos infinitos.
   */
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

/**
 * Comentario raíz con sus replies directas (1 nivel).
 * Para hilos infinitos, cambiar `replies` a `CommentThread[]` y hacerlo recursivo.
 */
export interface CommentThread extends Comment {
  replies: Comment[]
}

export type CreateCommentDTO = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCommentDTO = Pick<Comment, 'body'>
```

- [ ] **Step 2: Actualizar `schema.ts`**

Reemplazar el contenido completo de `src/entities/comment/schema.ts`:

```ts
// entities/comment/schema.ts
import { z } from 'zod'
import { uuidSchema } from '@/shared/schemas'

export const commentSchema = z.object({
  id: uuidSchema,
  reviewId: uuidSchema,
  groupId: uuidSchema,
  authorId: uuidSchema,
  body: z.string().min(1).max(500),
  parentId: uuidSchema.nullable(),
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

- [ ] **Step 3: Commit**

```bash
git add src/entities/comment/types.ts src/entities/comment/schema.ts
git commit -m "feat(comments): add parentId to Comment model for threaded replies"
```

---

## Task 2: Actualizar el service

**Files:**
- Modify: `src/shared/services/comment.service.ts`

- [ ] **Step 1: Actualizar `comment.service.ts`**

Reemplazar el contenido completo de `src/shared/services/comment.service.ts`:

```ts
// shared/services/comment.service.ts
import type { Comment, CommentThread, CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'
import { STORAGE_KEYS } from '@/shared/constants'
import { generateId } from '@/shared/utils'
import { getFromStorage, setToStorage } from './localStorage.service'

export interface ICommentService {
  getByReviewId(reviewId: string): Promise<CommentThread[]>
  create(data: CreateCommentDTO): Promise<Comment>
  update(id: string, data: UpdateCommentDTO): Promise<Comment>
  delete(id: string): Promise<void>
}

/**
 * Agrupa una lista plana de comentarios en árboles de 1 nivel.
 *
 * Actualmente solo se soporta 1 nivel: raíces (parentId === null) con sus replies directas.
 * Para escalar a hilos infinitos, hacer esta función recursiva:
 *   - Cambiar el tipo de retorno a un tipo árbol recursivo
 *   - Iterar sobre todos los nodos, no solo las raíces
 * Ver docs/plans/2026-03-30-comment-replies.md para la guía completa.
 */
function buildCommentThreads(comments: Comment[]): CommentThread[] {
  const roots = comments.filter((c) => c.parentId === null)
  const byParent = new Map<string, Comment[]>()

  for (const c of comments) {
    if (c.parentId !== null) {
      const list = byParent.get(c.parentId) ?? []
      list.push(c)
      byParent.set(c.parentId, list)
    }
  }

  return roots.map((root) => ({
    ...root,
    replies: byParent.get(root.id) ?? [],
  }))
}

export class LocalCommentService implements ICommentService {
  private readAll(): Comment[] {
    return getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, [])
  }

  private writeAll(comments: Comment[]): void {
    setToStorage(STORAGE_KEYS.COMMENTS, comments)
  }

  async getByReviewId(reviewId: string): Promise<CommentThread[]> {
    const all = this.readAll().filter((c) => c.reviewId === reviewId)
    return buildCommentThreads(all)
  }

  async create(data: CreateCommentDTO): Promise<Comment> {
    const comment: Comment = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.writeAll([...this.readAll(), comment])
    return comment
  }

  async update(id: string, data: UpdateCommentDTO): Promise<Comment> {
    const all = this.readAll()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Comment not found: ${id}`)
    const updated: Comment = { ...all[idx], ...data, updatedAt: new Date() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  async delete(id: string): Promise<void> {
    const all = this.readAll()
    // Al borrar un comentario raíz, también se borran sus replies
    const target = all.find((c) => c.id === id)
    const idsToDelete = new Set([id])
    if (target && target.parentId === null) {
      all.filter((c) => c.parentId === id).forEach((c) => idsToDelete.add(c.id))
    }
    this.writeAll(all.filter((c) => !idsToDelete.has(c.id)))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/services/comment.service.ts
git commit -m "feat(comments): build comment threads in service, cascade delete replies"
```

---

## Task 3: Actualizar hooks

**Files:**
- Modify: `src/features/comments/hooks/useComments.ts`

- [ ] **Step 1: Actualizar `useComments.ts`**

El hook `useComments` ahora devuelve `CommentThread[]`. Solo cambiar el import de tipos (el resto funciona igual):

```ts
// src/features/comments/hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import type { CreateCommentDTO, UpdateCommentDTO } from '@/entities/comment/types'

export const COMMENTS_QUERY_KEY = ['comments'] as const

export function useComments(reviewId: string) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, reviewId],
    queryFn: () => services.comments.getByReviewId(reviewId),
    enabled: !!reviewId,
  })
}

export function useCreateComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommentDTO) => services.comments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
  })
}

export function useUpdateComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentDTO }) =>
      services.comments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
  })
}

export function useDeleteComment(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COMMENTS_QUERY_KEY, reviewId] })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/hooks/useComments.ts
git commit -m "chore(comments): align useComments return type with CommentThread"
```

---

## Task 4: Actualizar `CommentForm` para soportar `parentId`

**Files:**
- Modify: `src/features/comments/components/CommentForm.tsx`

El formulario existente se usa para comentarios raíz. Solo agregar la prop opcional `parentId` al submit.

- [ ] **Step 1: Actualizar `CommentForm.tsx`**

Reemplazar el contenido completo de `src/features/comments/components/CommentForm.tsx`:

```tsx
'use client'

// src/features/comments/components/CommentForm.tsx

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUser } from '@/shared/lib/store'
import { useCreateComment } from '../hooks/useComments'

const commentFormSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(500, 'Max 500 characters'),
})

interface CommentFormProps {
  reviewId: string
  groupId: string
  /** Si se pasa, el comentario se crea como reply de este parentId */
  parentId?: string
}

export function CommentForm({ reviewId, groupId, parentId }: CommentFormProps) {
  const user = useUser()
  const createComment = useCreateComment(reviewId)
  const [focused, setFocused] = useState(false)

  const form = useForm({
    defaultValues: { body: '' },
    validators: { onChange: commentFormSchema },
    onSubmit: async ({ value }) => {
      if (!user) return
      await createComment.mutateAsync({
        reviewId,
        groupId,
        authorId: user.id,
        body: value.body.trim(),
        parentId: parentId ?? null,
      })
      form.reset()
      setFocused(false)
    },
  })

  if (!user) return null

  const displayName = user.displayName ?? user.username
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex gap-3.5"
    >
      {/* Avatar del usuario actual */}
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border/50">
        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <form.Field name="body">
          {(field) => (
            <div className="relative">
              <Textarea
                placeholder={parentId ? 'Write a reply…' : 'Leave a comment…'}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur()
                  if (!field.state.value.trim()) setFocused(false)
                }}
                onFocus={() => setFocused(true)}
                rows={focused ? 3 : 1}
                className="resize-none transition-all duration-150 text-sm"
                maxLength={500}
              />
              {focused && (
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
                  {field.state.value.length}/500
                </span>
              )}
            </div>
          )}
        </form.Field>

        {focused && (
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    form.reset()
                    setFocused(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="xs"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
                </Button>
              </div>
            )}
          </form.Subscribe>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/CommentForm.tsx
git commit -m "feat(comments): support parentId in CommentForm for threaded replies"
```

---

## Task 5: Crear `ReplyForm` — formulario inline compacto

**Files:**
- Create: `src/features/comments/components/ReplyForm.tsx`

Este componente es el form que aparece incrustado debajo de un comentario raíz cuando el usuario hace click en "Reply". Es más compacto que `CommentForm` (sin avatar, sin expand animation) porque vive dentro del card.

- [ ] **Step 1: Crear `ReplyForm.tsx`**

```tsx
'use client'

// src/features/comments/components/ReplyForm.tsx

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/shared/lib/store'
import { useCreateComment } from '../hooks/useComments'

const replySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty').max(500, 'Max 500 characters'),
})

interface ReplyFormProps {
  reviewId: string
  groupId: string
  parentId: string
  onCancel: () => void
}

export function ReplyForm({ reviewId, groupId, parentId, onCancel }: ReplyFormProps) {
  const user = useUser()
  const createComment = useCreateComment(reviewId)

  const form = useForm({
    defaultValues: { body: '' },
    validators: { onChange: replySchema },
    onSubmit: async ({ value }) => {
      if (!user) return
      await createComment.mutateAsync({
        reviewId,
        groupId,
        authorId: user.id,
        body: value.body.trim(),
        parentId,
      })
      onCancel()
    },
  })

  if (!user) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-2"
    >
      <form.Field name="body">
        {(field) => (
          <div className="relative">
            <Textarea
              placeholder="Write a reply…"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              autoFocus
              maxLength={500}
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
              {field.state.value.length}/500
            </span>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex justify-end gap-2">
            <Button type="button" size="xs" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="xs" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Posting…' : 'Reply'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/ReplyForm.tsx
git commit -m "feat(comments): add ReplyForm inline component"
```

---

## Task 6: Actualizar `CommentCard` — botón Reply + replies indentadas

**Files:**
- Modify: `src/features/comments/components/CommentCard.tsx`

Este es el cambio visual más importante. `CommentCard` ahora:
1. Recibe `replies?: Comment[]` y `depth?: number` (0 = raíz, 1 = reply)
2. Muestra un botón "Reply" en las raíces (`depth === 0`)
3. Renderiza las replies debajo, con indentación y línea vertical
4. Muestra el `ReplyForm` inline cuando el usuario hace click en Reply

- [ ] **Step 1: Reemplazar `CommentCard.tsx`**

```tsx
'use client'

// src/features/comments/components/CommentCard.tsx

import { useState } from 'react'
import { PencilIcon, TrashIcon, CheckIcon, XIcon, MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/shared/utils'
import { useUpdateComment, useDeleteComment } from '../hooks/useComments'
import { useUser } from '@/shared/lib/store'
import { ReplyForm } from './ReplyForm'
import type { Comment } from '@/entities/comment/types'

interface CommentCardProps {
  comment: Comment
  isOwn?: boolean
  /**
   * Replies directas de este comentario (solo aplica a comentarios raíz, depth === 0).
   * Para hilos infinitos, `replies` sería `CommentThread[]` y se renderizaría recursivamente.
   * Ver docs/plans/2026-03-30-comment-replies.md para la guía de escalado.
   */
  replies?: Comment[]
  /**
   * Profundidad actual del comentario. 0 = raíz, 1 = reply.
   * El botón "Reply" solo aparece en depth === 0 (1 nivel de profundidad).
   */
  depth?: number
  reviewId: string
  groupId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CommentCard({
  comment,
  isOwn = false,
  replies = [],
  depth = 0,
  reviewId,
  groupId,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const currentUser = useUser()

  const updateComment = useUpdateComment(comment.reviewId)
  const deleteComment = useDeleteComment(comment.reviewId)

  const handleSave = async () => {
    if (!editBody.trim()) return
    await updateComment.mutateAsync({ id: comment.id, data: { body: editBody.trim() } })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditBody(comment.body)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteComment.mutate(comment.id)
  }

  const authorName = isOwn && currentUser
    ? (currentUser.displayName ?? currentUser.username)
    : comment.authorId.slice(0, 8)

  const initials = getInitials(authorName)

  return (
    <div className="flex gap-3.5 group">
      {/* Avatar */}
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border/50">
        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(comment.createdAt)}
          </span>
          {comment.updatedAt > comment.createdAt && (
            <span className="text-xs text-muted-foreground/50 italic shrink-0">(edited)</span>
          )}
        </div>

        {/* Body / Edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="resize-none text-sm pr-14"
                autoFocus
                maxLength={500}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
                {editBody.length}/500
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                onClick={handleSave}
                disabled={updateComment.isPending || !editBody.trim()}
              >
                <CheckIcon className="size-3 mr-1" />
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={handleCancel}>
                <XIcon className="size-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
        )}

        {/* Botón Reply — solo en comentarios raíz (depth === 0) */}
        {depth === 0 && !isEditing && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground -ml-1 h-6 px-1.5 gap-1"
              onClick={() => setShowReplyForm((prev) => !prev)}
            >
              <MessageSquareIcon className="size-3" />
              {replies.length > 0 ? `Reply · ${replies.length}` : 'Reply'}
            </Button>
          </div>
        )}

        {/* ReplyForm inline */}
        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              reviewId={reviewId}
              groupId={groupId}
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Replies indentadas — siempre visibles si existen */}
        {replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-border/40 space-y-4">
            {replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                isOwn={reply.authorId === currentUser?.id}
                replies={[]}
                depth={1}
                reviewId={reviewId}
                groupId={groupId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions — visible on hover */}
      {isOwn && !isEditing && (
        <div className="flex items-start gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditing(true)}
            aria-label="Edit comment"
            className="text-muted-foreground hover:text-foreground"
          >
            <PencilIcon className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            disabled={deleteComment.isPending}
            aria-label="Delete comment"
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/CommentCard.tsx
git commit -m "feat(comments): show threaded replies with inline ReplyForm in CommentCard"
```

---

## Task 7: Actualizar `CommentList` para pasar threads

**Files:**
- Modify: `src/features/comments/components/CommentList.tsx`

`useComments` ahora devuelve `CommentThread[]`. `CommentList` pasa `replies` a cada `CommentCard`.

- [ ] **Step 1: Reemplazar `CommentList.tsx`**

```tsx
'use client'

// src/features/comments/components/CommentList.tsx

import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/shared/lib/store'
import { useComments } from '../hooks/useComments'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'

interface CommentListProps {
  reviewId: string
  groupId: string
}

export function CommentList({ reviewId, groupId }: CommentListProps) {
  const user = useUser()
  const { data: threads, isLoading } = useComments(reviewId)
  const count = threads?.length ?? 0

  return (
    <section className="space-y-8" aria-label="Discussion">
      {/* Write new comment */}
      <CommentForm reviewId={reviewId} groupId={groupId} />

      {/* Existing comments */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3.5">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : count > 0 ? (
        <div className="space-y-6">
          {threads!.map((thread) => (
            <CommentCard
              key={thread.id}
              comment={thread}
              isOwn={thread.authorId === user?.id}
              replies={thread.replies}
              depth={0}
              reviewId={reviewId}
              groupId={groupId}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 text-center py-10">
          No comments yet. Start the discussion.
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/CommentList.tsx
git commit -m "feat(comments): wire CommentThread replies into CommentList"
```

---

## Verificación final

- [ ] Crear un comentario raíz → aparece normalmente
- [ ] Hacer click en "Reply" en un comentario → aparece el `ReplyForm` inline
- [ ] Escribir y enviar una reply → aparece indentada debajo del comentario padre con línea vertical
- [ ] El botón "Reply" muestra el contador: `Reply · 2`
- [ ] Borrar un comentario raíz → también desaparecen sus replies
- [ ] Las replies NO tienen botón "Reply" (solo 1 nivel)
- [ ] Editar una reply funciona igual que editar un comentario raíz
- [ ] Borrar una reply individual funciona

