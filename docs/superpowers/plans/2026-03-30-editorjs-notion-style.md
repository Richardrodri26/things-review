# EditorJS Notion-Style Review Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la página de review en una experiencia editorial estilo Notion: editor rico con EditorJS, diseño inmersivo con cover/hero, y sección de comentarios integrada al final.

**Architecture:** La infraestructura base ya existe (EditorJS instalado, servicios de comentarios, rutas). El trabajo es puramente de UI/UX: estilos del editor, rediseño de `ReviewDetailPage` con estética editorial, mejora del `EditorClient` en el formulario, y pulido de la sección de comentarios.

**Tech Stack:** Next.js 16, React 19, EditorJS 2.x, Tailwind CSS 4, shadcn/ui (Base UI), TypeScript, TanStack Query

---

## Estado Actual

- **EditorJS** — instalado con todos los tools (header, list, quote, code, checklist, marker, inlineCode, delimiter, embed, image)
- **`EditorClient`** — funcional pero sin estilos propios del editor (se ve roto)
- **`EditorRenderer`** — renderiza bloques correctamente pero con tipografía genérica
- **`ReviewDetailPage`** — esqueleto funcional pero sin diseño editorial
- **`CommentList/Card/Form`** — funcionales pero básicos visualmente
- **TypeScript** — compila sin errores ✅

## File Structure

```
src/
├── app/
│   └── globals.css                         ← MODIFY: agregar estilos del editor EditorJS
├── components/
│   └── editor/
│       ├── editor-client.tsx               ← MODIFY: mejorar UX, estilos Notion-style
│       ├── editor-renderer.tsx             ← MODIFY: tipografía editorial, prose mejorado
│       └── editor-tools.ts                 ← OK (no cambiar)
└── features/
    ├── reviews/
    │   └── components/
    │       ├── ReviewDetailPage.tsx        ← MODIFY: diseño completo Notion-style
    │       └── ReviewForm.tsx              ← MODIFY: editor más prominente
    └── comments/
        └── components/
            ├── CommentCard.tsx             ← MODIFY: avatar real, diseño pulido
            ├── CommentForm.tsx             ← MODIFY: expansión fluida, counter
            └── CommentList.tsx             ← MODIFY: header con count, divider editorial
```

---

## Task 1: Estilos CSS para EditorJS

**Objetivo:** EditorJS inserta sus propios elementos DOM. Sin CSS customizado, el editor se ve sin formato y el placeholder no aparece. Necesitamos sobrescribir los estilos base de EditorJS para que coincidan con el design system.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Agregar estilos EditorJS al globals.css**

Agregar al final de `src/app/globals.css`:

```css
/* ============================================================
   EditorJS — Notion-style editor overrides
   ============================================================ */

/* Contenedor principal del editor */
.codex-editor {
  @apply w-full;
}

.codex-editor__redactor {
  @apply pb-10 !important;
}

/* Bloques */
.ce-block {
  @apply w-full;
}

.ce-block__content {
  @apply max-w-none mx-0;
}

/* Paragraph */
.ce-paragraph {
  @apply text-base leading-7 text-foreground outline-none;
  min-height: 1.75rem;
}

.ce-paragraph[data-placeholder]:empty::before {
  @apply text-muted-foreground/60;
}

/* Toolbar */
.ce-toolbar__content {
  @apply max-w-none;
}

.ce-toolbar__plus {
  @apply text-muted-foreground hover:text-foreground transition-colors;
  @apply bg-transparent border border-border rounded-md;
  @apply size-7 flex items-center justify-center;
}

.ce-toolbar__plus:hover {
  @apply bg-muted;
}

.ce-toolbar__settings-btn {
  @apply text-muted-foreground hover:text-foreground;
}

/* Toolbox */
.ce-toolbox {
  @apply bg-popover border border-border shadow-md rounded-lg p-1;
}

.ce-toolbox__button {
  @apply rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors;
  @apply size-8 flex items-center justify-center;
}

/* Inline toolbar */
.ce-inline-toolbar {
  @apply bg-popover border border-border shadow-lg rounded-lg overflow-hidden;
}

.ce-inline-tool {
  @apply text-muted-foreground hover:text-foreground hover:bg-muted transition-colors;
  @apply size-8 flex items-center justify-center;
}

.ce-inline-tool--active {
  @apply text-foreground bg-muted;
}

/* Conversion toolbar */
.ce-conversion-toolbar {
  @apply bg-popover border border-border shadow-lg rounded-lg;
}

.ce-conversion-tool {
  @apply hover:bg-muted transition-colors rounded-md;
}

.ce-conversion-tool__icon {
  @apply bg-muted rounded;
}

/* Block settings */
.ce-settings {
  @apply bg-popover border border-border shadow-lg rounded-lg p-1;
}

.ce-settings__button {
  @apply rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors;
  @apply flex items-center gap-2 px-2 py-1.5 text-sm;
}

/* Header block */
.ce-header {
  @apply outline-none font-bold leading-tight text-foreground;
}

/* Code block */
.ce-code__textarea {
  @apply font-mono text-sm bg-muted border border-border rounded-md p-3 w-full resize-none outline-none;
  @apply text-foreground;
}

/* Quote block */
.cdx-quote__text {
  @apply italic text-muted-foreground border-l-4 border-primary/40 pl-4 outline-none;
  min-height: 2.5rem;
}

.cdx-quote__caption {
  @apply text-xs text-muted-foreground/70 outline-none mt-1;
}

/* List block */
.cdx-list {
  @apply text-foreground;
}

.cdx-list__item {
  @apply leading-7;
}

/* Checklist */
.cdx-checklist__item {
  @apply flex items-start gap-2 leading-7;
}

.cdx-checklist__item-checkbox {
  @apply mt-1 size-4 rounded border border-border cursor-pointer transition-colors;
  @apply appearance-none shrink-0;
}

.cdx-checklist__item-checkbox:checked {
  @apply bg-primary border-primary;
}

.cdx-checklist__item--checked .cdx-checklist__item-text {
  @apply line-through text-muted-foreground;
}

/* Image block */
.image-tool__image {
  @apply rounded-md overflow-hidden;
}

.image-tool__caption {
  @apply text-xs text-center text-muted-foreground mt-1.5 outline-none;
}

/* Delimiter */
.ce-delimiter {
  @apply text-muted-foreground text-center text-xl tracking-widest py-2;
}

.ce-delimiter::before {
  content: "· · ·";
  @apply text-muted-foreground/50;
}

/* Popover (block type picker) */
.ce-popover {
  @apply bg-popover border border-border shadow-xl rounded-xl p-1.5;
}

.ce-popover-item {
  @apply flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer;
}

.ce-popover-item__icon {
  @apply size-8 rounded-md bg-muted flex items-center justify-center shrink-0;
}

.ce-popover-item__title {
  @apply text-sm font-medium text-foreground;
}

.ce-popover-item__secondary-title {
  @apply text-xs text-muted-foreground;
}

.ce-popover-item--active,
.ce-popover-item:hover {
  @apply bg-muted;
}

.ce-popover__search {
  @apply w-full bg-muted border-0 rounded-lg px-3 py-2 text-sm outline-none mb-1;
  @apply text-foreground placeholder:text-muted-foreground;
}

/* Focus styles for blocks */
.ce-block--focused .ce-block__content {
  @apply rounded-sm;
}

/* Remove native focus rings inside editor */
.codex-editor [contenteditable]:focus {
  outline: none;
}

/* Marker (highlight) */
.cdx-marker {
  @apply bg-yellow-200/80 dark:bg-yellow-900/60 rounded-sm px-0.5;
}

/* Inline code */
.inline-code {
  @apply font-mono text-sm bg-muted px-1 rounded;
}

/* Link */
.ce-link-autocomplete__input {
  @apply bg-popover border border-border rounded-md px-3 py-1.5 text-sm outline-none;
  @apply text-foreground placeholder:text-muted-foreground;
}
```

- [ ] **Step 2: Verificar que el editor se ve bien en el formulario**

Correr `bun dev` y navegar a la pantalla de crear review. El editor debe mostrar el toolbar de `+` al hacer hover en un bloque, y el placeholder "Write your thoughts..." debe verse en gris.

---

## Task 2: Mejorar EditorClient — UX Notion

**Objetivo:** El `EditorClient` actual tiene una altura fija mínima genérica. Notion tiene un área de escritura limpia y sin bordes, con el `+` sidebar para agregar bloques. Necesitamos mejorarlo para una experiencia de escritura inmersiva.

**Files:**
- Modify: `src/components/editor/editor-client.tsx`

- [ ] **Step 1: Actualizar EditorClient con estilos mejorados**

Reemplazar el contenido de `src/components/editor/editor-client.tsx`:

```tsx
'use client'

// src/components/editor/editor-client.tsx
import { useEffect, useRef, useState } from 'react'
import type { OutputData } from '@editorjs/editorjs'
import type EditorJSType from '@editorjs/editorjs'
import { EDITOR_JS_TOOLS } from './editor-tools'
import { cn } from '@/shared/utils'

let EditorJS: typeof EditorJSType | null = null

interface EditorClientProps {
  defaultValue?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  /** Modo compacto para formularios (con borde). Default: false (sin borde, full-width) */
  compact?: boolean
}

export function EditorClient({
  defaultValue,
  onChange,
  placeholder = 'Start writing your review...',
  readOnly = false,
  className = '',
  compact = false,
}: EditorClientProps) {
  const editorRef = useRef<EditorJSType | null>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const onChangeRef = useRef(onChange)
  const instanceId = useRef(`editor-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !holderRef.current) return

    const initEditor = async () => {
      if (!EditorJS) {
        const module = await import('@editorjs/editorjs')
        EditorJS = module.default
      }

      if (!holderRef.current || editorRef.current) return

      const editor = new EditorJS({
        holder: holderRef.current,
        placeholder,
        readOnly,
        data: defaultValue ?? { time: Date.now(), blocks: [] },
        onChange: async () => {
          if (onChangeRef.current && editorRef.current) {
            try {
              const data = await editorRef.current.save()
              onChangeRef.current(data)
            } catch (error) {
              console.error('Error saving editor data:', error)
            }
          }
        },
        tools: EDITOR_JS_TOOLS,
        // EditorJS config para experiencia Notion
        autofocus: false,
        inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode'],
      })

      editorRef.current = editor

      try {
        await editor.isReady
        setIsReady(true)
      } catch (error) {
        console.error('Editor ready error:', error)
      }
    }

    initEditor()

    return () => {
      const editor = editorRef.current
      if (editor) {
        editorRef.current = null
        setIsReady(false)
        try {
          editor.destroy()
        } catch {
          // silently ignore
        }
      }
    }
  }, [isMounted, placeholder, readOnly])

  // Cargar datos solo cuando el editor está listo y los datos cambian externamente
  const prevDataRef = useRef<OutputData | undefined>(defaultValue)
  useEffect(() => {
    if (isReady && editorRef.current && defaultValue && defaultValue !== prevDataRef.current) {
      prevDataRef.current = defaultValue
      editorRef.current.render(defaultValue).catch((e: unknown) => console.error(e))
    }
  }, [isReady, defaultValue])

  if (!isMounted) {
    return (
      <div className={cn('animate-pulse space-y-3 py-2', className)}>
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div
      id={instanceId.current}
      className={cn(
        'editor-client-wrapper relative',
        compact && 'min-h-[160px]',
        className,
      )}
    >
      <div
        ref={holderRef}
        className={cn(
          'editor-content w-full',
          // Notion-style: sin borde, tipografía grande y limpia
          '[&_.ce-paragraph]:text-base',
          '[&_.ce-paragraph]:leading-7',
        )}
      />
    </div>
  )
}

// Helper para extraer texto plano del output de EditorJS
export function extractPlainText(data: OutputData): string {
  if (!data.blocks) return ''

  return data.blocks
    .map((block) => {
      const blockData = block.data as Record<string, unknown>
      switch (block.type) {
        case 'paragraph':
        case 'header':
          return (blockData.text as string)?.replace(/<[^>]*>/g, '') ?? ''
        case 'list':
          return (blockData.items as string[])
            .map((i) => (typeof i === 'string' ? i.replace(/<[^>]*>/g, '') : ''))
            .join('\n')
        case 'quote':
          return `${(blockData.text as string)?.replace(/<[^>]*>/g, '') ?? ''}${blockData.caption ? `\n— ${blockData.caption}` : ''}`
        case 'code':
          return blockData.code as string
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

// Helper para verificar si el editor tiene contenido
export function isEditorEmpty(data?: OutputData): boolean {
  if (!data?.blocks || data.blocks.length === 0) return true
  return data.blocks.every((block) => {
    const blockData = block.data as Record<string, unknown>
    if (block.type === 'paragraph') {
      const text = blockData.text as string
      return !text || text.replace(/<[^>]*>/g, '').trim() === ''
    }
    return false
  })
}
```

- [ ] **Step 2: Verificar**

En el formulario de review, el editor debe ocupar el espacio disponible sin bordes extra, con el placeholder visible y el toolbar `+` aparecer al lado de cada bloque vacío.

---

## Task 3: ReviewDetailPage — Diseño Notion editorial

**Objetivo:** La `ReviewDetailPage` actual es funcional pero genérica (lista de divs apilados). La visión es una página editorial como Notion: ancho de lectura generoso, header con metadata destacada, cuerpo del artículo con tipografía editorial, y la sección de comentarios integrada naturalmente al final.

**Aesthetic Direction:** Minimal editorial. Inspirado en Notion y linear.app:
- Máximo ancho de lectura (`max-w-2xl` para el texto, `max-w-3xl` para el layout)  
- Header limpio con el título dominante  
- Rating visual con estrellas grandes  
- Metadata sutil (fecha, badges) antes del título  
- Cuerpo del artículo con tipografía grande y espaciado generoso  
- Spoiler gate elegante  
- Sección de comentarios separada con un divider claro y título de sección

**Files:**
- Modify: `src/features/reviews/components/ReviewDetailPage.tsx`

- [ ] **Step 1: Reescribir ReviewDetailPage**

Reemplazar el contenido completo de `src/features/reviews/components/ReviewDetailPage.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeOffIcon,
  CalendarIcon,
  MessageSquareIcon,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { RatingStars, ContentTypeBadge, StatusBadge } from '@/shared/ui/atoms'
import { EditorRenderer } from '@/components/editor/editor-renderer'
import { CommentList } from '@/features/comments/components'
import { ROUTES } from '@/shared/constants'
import { formatDate } from '@/shared/utils'
import { useCatalogItemTitle } from '@/features/catalog/hooks'
import { useReviewById, useDeleteReview } from '../hooks'
import { cn } from '@/lib/utils'

const DEFAULT_GROUP_ID = 'personal'

interface ReviewDetailPageProps {
  reviewId: string
}

export function ReviewDetailPage({ reviewId }: ReviewDetailPageProps) {
  const router = useRouter()
  const { data: review, isLoading } = useReviewById(reviewId)
  const itemTitle = useCatalogItemTitle(review?.contentId ?? '')
  const deleteReview = useDeleteReview()
  const [showSpoilers, setShowSpoilers] = useState(false)

  const handleDelete = async () => {
    await deleteReview.mutateAsync(reviewId)
    router.push(ROUTES.REVIEWS)
  }

  if (isLoading) return <ReviewDetailSkeleton />
  if (!review) notFound()

  const hasBody = review.body?.blocks && review.body.blocks.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar — sticky */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link
            href={ROUTES.REVIEWS}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              '-ml-2 text-muted-foreground hover:text-foreground',
            )}
          >
            <ArrowLeftIcon className="size-4 mr-1.5" />
            Reviews
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href={ROUTES.REVIEWS}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-muted-foreground',
              )}
            >
              <PencilIcon className="size-3.5 mr-1.5" />
              Edit
            </Link>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <TrashIcon className="size-3.5 mr-1.5" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The review and all comments will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} variant="destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pt-12 pb-24">

        {/* ── Header ────────────────────────────────── */}
        <header className="space-y-5 mb-10">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <ContentTypeBadge contentType={review.contentType} />
            <StatusBadge status={review.status} contentType={review.contentType} />
            {review.containsSpoilers && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-400/50 text-xs">
                <EyeOffIcon className="size-3" />
                Spoilers
              </Badge>
            )}
          </div>

          {/* Content subtitle */}
          {itemTitle && (
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {itemTitle}
            </p>
          )}

          {/* Review title — Notion-style: large, bold, editorial */}
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground">
            {review.title ?? `Review of ${itemTitle ?? review.contentId}`}
          </h1>

          {/* Rating */}
          {review.rating && (
            <div className="pt-1">
              <RatingStars value={review.rating} readonly size="lg" />
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3" />
              {formatDate(review.createdAt)}
            </span>
            {review.updatedAt > review.createdAt && (
              <span className="italic">edited {formatDate(review.updatedAt)}</span>
            )}
          </div>
        </header>

        <Separator className="mb-10" />

        {/* ── Body ──────────────────────────────────── */}
        {hasBody && (
          <section className="mb-16">
            {review.containsSpoilers && !showSpoilers ? (
              <SpoilerGate onReveal={() => setShowSpoilers(true)} />
            ) : (
              <EditorRenderer
                data={review.body!}
                className="notion-body"
              />
            )}
          </section>
        )}

        {!hasBody && (
          <p className="text-muted-foreground/60 italic text-sm mb-16">
            No written review. Just the rating above.
          </p>
        )}

        {/* ── Comments ──────────────────────────────── */}
        <div className="border-t border-border/60 pt-12">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquareIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Discussion
            </h2>
          </div>
          <CommentList reviewId={reviewId} groupId={DEFAULT_GROUP_ID} />
        </div>
      </article>
    </div>
  )
}

// ── Spoiler Gate ────────────────────────────────────────────
function SpoilerGate({ onReveal }: { onReveal: () => void }) {
  return (
    <div className="rounded-xl border border-amber-300/40 bg-amber-50/20 dark:bg-amber-950/10 p-10 text-center space-y-4">
      <div className="text-4xl select-none">⚠️</div>
      <div className="space-y-1.5">
        <p className="font-semibold text-foreground">This review contains spoilers</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Continue only if you&apos;ve already experienced this content.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onReveal}
        className="mt-2"
      >
        <EyeOffIcon className="size-3.5 mr-1.5" />
        Reveal anyway
      </Button>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
function ReviewDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 h-12" />
      <div className="max-w-3xl mx-auto px-6 pt-12 space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-40" />
        <Separator />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Agregar tipografía editorial al EditorRenderer**

Abrir `src/components/editor/editor-renderer.tsx` y actualizar las clases CSS de cada bloque para usar tipografía editorial más refinada. Los cambios clave son:
- `paragraph`: `text-[17px] leading-[1.75]` — tamaño de lectura cómodo
- `header h2`: `text-2xl font-bold mt-8 mb-3`
- `header h3`: `text-xl font-semibold mt-6 mb-2`
- `blockquote`: borde izquierdo más prominente, texto más grande

Actualizar la función `BlockRenderer` en `editor-renderer.tsx`:

```tsx
// Reemplazar el switch en BlockRenderer con estos casos actualizados:

case 'header': {
  const { text, level } = data as HeaderData
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const sizeClass = {
    1: 'text-3xl font-bold mt-10 mb-4',
    2: 'text-2xl font-bold mt-8 mb-3',
    3: 'text-xl font-semibold mt-6 mb-2',
    4: 'text-lg font-semibold mt-4 mb-1.5',
    5: 'text-base font-semibold mt-3 mb-1',
    6: 'text-sm font-semibold mt-2 mb-1 uppercase tracking-wide text-muted-foreground',
  }[level] ?? 'text-xl font-semibold'
  return (
    <Tag
      className={cn(sizeClass, 'leading-tight text-foreground first:mt-0')}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  )
}

case 'paragraph': {
  const { text } = data as ParagraphData
  if (!text) return null
  return (
    <p
      className="text-[17px] leading-[1.75] text-foreground"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  )
}

case 'list': {
  const { style, items } = data as ListData
  if (style === 'ordered') {
    return (
      <ol className="list-decimal list-outside ml-6 space-y-1.5 text-[17px] leading-[1.75] text-foreground">
        {items.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ol>
    )
  }
  return (
    <ul className="list-disc list-outside ml-6 space-y-1.5 text-[17px] leading-[1.75] text-foreground">
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </ul>
  )
}

case 'quote': {
  const { text, caption } = data as QuoteData
  return (
    <blockquote className="border-l-[3px] border-primary/50 pl-5 py-1 my-6 space-y-1.5">
      <p
        className="text-lg italic text-foreground/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {caption && (
        <cite
          className="text-sm text-muted-foreground not-italic flex items-center gap-1.5 before:content-['—']"
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      )}
    </blockquote>
  )
}
```

- [ ] **Step 3: Verificar la ReviewDetailPage**

Navegar a `/reviews/[id]` (crear una review con texto si no hay). El layout debe verse:
- Navbar sticky fino en la parte superior
- Título grande en `text-4xl`
- Separador limpio antes del cuerpo
- El cuerpo del artículo con tipografía editorial
- Sección "Discussion" separada con título de sección

---

## Task 4: Mejorar la sección de Comentarios

**Objetivo:** `CommentCard` y `CommentList` son funcionales pero los avatares muestran IDs truncados. Necesitamos conectar el `user.displayName` donde sea posible y mejorar el look de los comentarios.

**Files:**
- Modify: `src/features/comments/components/CommentCard.tsx`
- Modify: `src/features/comments/components/CommentList.tsx`

- [ ] **Step 1: Mejorar CommentCard — usar displayName del store**

Reemplazar `src/features/comments/components/CommentCard.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/shared/utils'
import { useUpdateComment, useDeleteComment } from '../hooks/useComments'
import { useUser } from '@/shared/lib/store'
import type { Comment } from '@/entities/comment/types'

interface CommentCardProps {
  comment: Comment
  isOwn?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CommentCard({ comment, isOwn = false }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
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

  // Nombre a mostrar: si es el usuario actual, usar su displayName
  const authorName = isOwn && currentUser
    ? (currentUser.displayName ?? currentUser.username)
    : comment.authorId.slice(0, 8)

  const initials = getInitials(authorName)

  return (
    <div className="flex gap-3.5 group">
      {/* Avatar */}
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border">
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
            <span className="text-xs text-muted-foreground/60 italic shrink-0">(edited)</span>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              autoFocus
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {editBody.length}/500
              </span>
              <div className="flex gap-2">
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
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{comment.body}</p>
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

- [ ] **Step 2: Mejorar CommentList — diseño más editorial**

Reemplazar `src/features/comments/components/CommentList.tsx`:

```tsx
'use client'

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
  const { data: comments, isLoading } = useComments(reviewId)

  const count = comments?.length ?? 0

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
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : count > 0 ? (
        <div className="space-y-6">
          {comments!.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isOwn={comment.authorId === user?.id}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/70 text-center py-8">
          No comments yet. Start the discussion.
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Mejorar CommentForm — expandible estilo GitHub**

Reemplazar `src/features/comments/components/CommentForm.tsx`:

```tsx
'use client'

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
}

export function CommentForm({ reviewId, groupId }: CommentFormProps) {
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
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border">
        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <form.Field name="body">
          {(field) => (
            <div className="relative">
              <Textarea
                placeholder="Leave a comment…"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur()
                  if (!field.state.value.trim()) setFocused(false)
                }}
                onFocus={() => setFocused(true)}
                rows={focused ? 4 : 1}
                className="resize-none transition-all duration-150 text-sm"
                maxLength={500}
              />
              {focused && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/60 pointer-events-none">
                  {field.state.value.length}/500
                </div>
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
                  {isSubmitting ? 'Posting…' : 'Comment'}
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

- [ ] **Step 4: Verificar la sección de comentarios**

En `/reviews/[id]`, al fondo debe aparecer:
- Un header "Discussion" con ícono de mensaje
- El form de comentario con avatar del usuario actual
- Los comentarios existentes con nombre real (no IDs)
- Al hovear sobre un comentario propio, aparecen los botones de editar/eliminar

---

## Task 5: Verificación final de TypeScript y UX

**Files:** Ninguno nuevo — solo verificación

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Sin errores de compilación.

- [ ] **Step 2: Smoke test visual**

Correr `bun dev` y verificar:
1. `/reviews` — las ReviewCards muestran preview de texto plano ✓
2. Click en una review → va a `/reviews/[id]` ✓  
3. La página muestra el header editorial con título grande ✓
4. El cuerpo de la review (EditorRenderer) tiene tipografía editorial ✓
5. La sección "Discussion" aparece al final ✓
6. El form de comentarios se expande al hacer focus ✓
7. Crear una review nueva → EditorJS carga con toolbar ✓
8. El toolbar `+` aparece al hovear en un bloque ✓

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement EditorJS notion-style review pages with editorial design"
```

---

## Self-Review

### Spec Coverage
- ✅ EditorJS como editor de reviews (ya instalado, mejorado con Task 1+2)
- ✅ Estilo Notion (Task 3 — layout editorial, título grande, navbar sticky)
- ✅ Sección de comentarios al final (Task 4 — CommentList con Discussion header)
- ✅ shadcn components (Avatar, Button, Textarea, Separator, Badge, AlertDialog, Skeleton — todos usados)

### Riesgos
- EditorJS muta el DOM directamente, los estilos CSS deben usar selectores de clase específicos (`.codex-editor`, `.ce-block`, etc.) — cubierto en Task 1
- `defaultValue` en EditorClient tenía un re-render bug (renderizaba en cada onChange). Corregido en Task 2 con `prevDataRef`
- `useCatalogItemTitle` lee del QueryClient cache, puede retornar `undefined` si el cache está vacío — manejado con fallback al `contentId`
