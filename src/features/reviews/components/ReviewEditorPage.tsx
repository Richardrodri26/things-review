'use client'

// src/features/reviews/components/ReviewEditorPage.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { XIcon, CheckIcon, BookOpenIcon, PencilIcon, AlertTriangleIcon } from 'lucide-react'
import type { OutputData } from '@editorjs/editorjs'
import { Button } from '@/components/ui/button'
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
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { EditorClient } from '@/components/editor/editor-client'
import { ContentPicker } from './ContentPicker'
import { useCatalogItem } from '@/features/catalog/hooks/useCatalog'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/lib/utils'

// Valida los campos del sidebar
const sidebarSchema = z.object({
  contentId:        z.string().min(1, 'Select a content to review'),
  contentType:      z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast']),
  rating:           z.number().min(1).max(5).optional(),
  containsSpoilers: z.boolean(),
  status:           z.enum(['consumed', 'want_to_consume', 'consuming', 'dropped']),
})

type SidebarFormData = z.input<typeof sidebarSchema>

function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  if (typeof error === 'string') return error
  return undefined
}

const STATUS_OPTIONS = [
  { value: 'consumed' },
  { value: 'want_to_consume' },
  { value: 'consuming' },
  { value: 'dropped' },
]

interface ReviewEditorPageProps extends ReviewFormProps {
  /** Title shown at the top of the editor page */
  contentTitle?: string
}

export function ReviewEditorPage({
  mode,
  initialValues,
  review,
  onSuccess,
  onCancel,
  contentTitle,
}: ReviewEditorPageProps) {
  const t = useTranslations('reviews.editor')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const user = useUser()
  const createReview = useCreateReview({
    saved: tToasts('reviews.saved'),
    savedError: tToasts('reviews.savedError'),
    savedErrorDescription: tToasts('tryAgain'),
  })
  const updateReview = useUpdateReview({
    updated: tToasts('reviews.updated'),
    updatedError: tToasts('reviews.updatedError'),
    updatedErrorDescription: tToasts('tryAgain'),
  })

  // ── Refs para los campos de escritura libre ──────────────
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<OutputData | undefined>(
    (initialValues?.body ?? review?.body) as OutputData | undefined
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Content lock — solo relevante en modo edit ───────────
  // En edit, el contenido empieza locked. El usuario puede desbloquearlo
  // con un click explícito, lo que muestra una advertencia.
  const isEditMode = mode === 'edit'
  const [contentLocked, setContentLocked] = useState(isEditMode)
  const [contentIdError, setContentIdError] = useState<string | undefined>()

  // El tipo/id que se muestra cuando está locked (el original de la review)
  const lockedContentType = review?.contentType ?? initialValues?.contentType
  const lockedContentId   = review?.contentId   ?? initialValues?.contentId
  const lockedItem = useCatalogItem(lockedContentType ?? null, lockedContentId ?? '')

  // ── Lock body scroll ─────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Escape para cerrar ───────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // ── Form para los campos del sidebar ────────────────────
  const form = useForm({
    defaultValues: {
      contentId:        initialValues?.contentId ?? review?.contentId ?? '',
      contentType:      (initialValues?.contentType ?? review?.contentType ?? 'movie') as SidebarFormData['contentType'],
      rating:           (initialValues?.rating ?? review?.rating) as SidebarFormData['rating'],
      containsSpoilers: initialValues?.containsSpoilers ?? review?.containsSpoilers ?? false,
      status:           (initialValues?.status ?? review?.status ?? 'consumed') as SidebarFormData['status'],
    },
  })

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!user || isSubmitting) return

    const sidebarState = form.state.values
    const validation = sidebarSchema.safeParse(sidebarState)

    if (!validation.success) {
      // Forzar que los campos muestren sus errores
      form.setFieldMeta('contentId', (prev) => ({ ...prev, isTouched: true, isDirty: true }))
      form.setFieldMeta('status',    (prev) => ({ ...prev, isTouched: true, isDirty: true }))

      // Actualizar el error de contentId para mostrarlo inline
      const contentIdIssue = validation.error.issues.find((i) => i.path[0] === 'contentId')
      setContentIdError(contentIdIssue?.message)

      if (contentIdIssue) {
        toast.error({ title: tToasts('reviews.selectContent') })
      }
      return
    }

    setContentIdError(undefined)

    const formValues: ReviewFormValues = {
      ...validation.data,
      title: titleRef.current?.value || undefined,
      body:  bodyRef.current,
    }

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        const result = await createReview.mutateAsync({ ...formValues, userId: user.id })
        onSuccess?.(result)
      } else if (mode === 'edit' && review) {
        const result = await updateReview.mutateAsync({ id: review.id, data: formValues })
        onSuccess?.(result)
      }
    } catch {
      toast.error({
        title: tToasts('reviews.failedToSave'),
        description: tToasts('reviews.failedToSaveDescription'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [user, isSubmitting, form, mode, review, createReview, updateReview, onSuccess, tToasts])

  // ── onChange del editor ──────────────────────────────────
  const handleEditorChange = useCallback((data: OutputData) => {
    bodyRef.current = data
  }, [])

  const initialTitle = initialValues?.title ?? review?.title ?? ''
  const initialBody = bodyRef.current

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ isolation: 'isolate' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpenIcon className="size-4" />
          <span className="font-medium text-foreground">
            {mode === 'create' ? t('titleNew') : t('titleEdit')}
          </span>
          {contentTitle && (
            <>
              <span className="text-border">/</span>
              <span className="truncate max-w-[200px]">{contentTitle}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5" disabled={isSubmitting}>
            <XIcon className="size-3.5" />
            {tCommon('cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
            <CheckIcon className="size-3.5" />
            {isSubmitting ? tCommon('saving') : mode === 'create' ? t('publish') : t('saveChanges')}
          </Button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Editor area ─────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-10 flex flex-col gap-4">

            {contentTitle && (
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                {initialValues?.contentType ?? review?.contentType ?? 'review'} · {contentTitle}
              </p>
            )}

            <input
              ref={titleRef}
              defaultValue={initialTitle}
              placeholder={t('titlePlaceholder')}
              className="review-editor-title"
            />

            <form.Field name="rating">
              {(field) => (
             <RatingStars
                   value={field.state.value}
                   onChange={(r: Rating) => field.handleChange(r)}
                   size="lg"
                   showValue
                 />
              )}
            </form.Field>

            <div className="h-px bg-border/40 my-2" />

            <div className="flex-1 min-h-[400px]">
              <EditorClient
                defaultValue={initialBody}
                onChange={handleEditorChange}
                placeholder={t('bodyPlaceholder')}
                className="min-h-[400px]"
              />
            </div>
          </div>
        </main>

        {/* ── Sidebar ─────────────────────────────── */}
        <aside className="hidden sm:flex w-64 flex-col gap-5 border-l border-border/60 bg-muted/20 px-5 py-8 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t('properties')}
          </p>

          {/* ── Content ─────────────────────────────── */}
          <SidebarProperty label={t('content')}>
            {isEditMode && contentLocked ? (
              /* Locked — muestra el contenido actual con botón de cambio */
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {lockedContentType && (
                      <span className="shrink-0 text-sm">
                        {CONTENT_TYPE_LABELS[lockedContentType]?.icon}
                      </span>
                    )}
                    <span className="truncate text-xs font-medium">
                      {lockedItem?.title ?? lockedContentId ?? '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentLocked(false)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title={t('changeContent')}
                  >
                    <PencilIcon className="size-3" />
                  </button>
                </div>
              </div>
            ) : isEditMode && !contentLocked ? (
              /* Unlocked en edit — picker + advertencia */
              <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertTriangleIcon className="size-3 shrink-0" />
                    <span>{t('reassignWarning')}</span>
                  </div>
                <form.Field name="contentType">
                  {(typeField) => (
                    <form.Field name="contentId">
                      {(idField) => (
                        <>
                          <ContentPicker
                            contentType={typeField.state.value as ReviewFormValues['contentType']}
                            contentId={idField.state.value}
                            onTypeChange={(type) => {
                              typeField.handleChange(type)
                              idField.handleChange('')
                              setContentIdError(undefined)
                            }}
                            onItemChange={(id) => {
                              idField.handleChange(id)
                              if (id) setContentIdError(undefined)
                            }}
                            compact
                          />
                          {contentIdError && (
                            <p className="text-xs text-destructive mt-0.5">{contentIdError}</p>
                          )}
                        </>
                      )}
                    </form.Field>
                  )}
                </form.Field>
                <button
                  type="button"
                  onClick={() => {
                    setContentLocked(true)
                    // Restaurar el valor original
                    form.setFieldValue('contentId',   lockedContentId   ?? '')
                    form.setFieldValue('contentType', (lockedContentType ?? 'movie') as SidebarFormData['contentType'])
                    setContentIdError(undefined)
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline self-start"
                >
                  {t('cancelChange')}
                </button>
              </div>
            ) : (
              /* Modo create — picker libre */
              <form.Field name="contentType">
                {(typeField) => (
                  <form.Field name="contentId">
                    {(idField) => (
                      <>
                        <ContentPicker
                          contentType={typeField.state.value as ReviewFormValues['contentType']}
                          contentId={idField.state.value}
                          onTypeChange={(type) => {
                            typeField.handleChange(type)
                            idField.handleChange('')
                            setContentIdError(undefined)
                          }}
                          onItemChange={(id) => {
                            idField.handleChange(id)
                            if (id) setContentIdError(undefined)
                          }}
                          compact
                        />
                        {contentIdError && (
                          <p className="text-xs text-destructive mt-0.5">{contentIdError}</p>
                        )}
                      </>
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}
          </SidebarProperty>

          {/* ── Status ──────────────────────────────── */}
          <form.Field name="status">
            {(field) => (
              <SidebarProperty label={t('status')}>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => v && field.handleChange(v as ReviewFormValues['status'])}
                >
                  <SelectTrigger className={cn('h-8 text-xs', field.state.meta.errors.length > 0 && 'border-destructive')}>
                    <SelectValue placeholder={t('status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {t(`statusOptions.${opt.value}` as `statusOptions.${typeof opt.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">
                    {getErrorMessage(field.state.meta.errors[0])}
                  </p>
                )}
              </SidebarProperty>
            )}
          </form.Field>

          {/* ── Spoilers ────────────────────────────── */}
          <form.Field name="containsSpoilers">
            {(field) => (
              <SidebarProperty label={t('containsSpoilers')}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.state.value}
                  onClick={() => field.handleChange(!field.state.value)}
                  className={[
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    field.state.value ? 'bg-primary' : 'bg-input',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg',
                      'transition-transform',
                      field.state.value ? 'translate-x-4' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </SidebarProperty>
            )}
          </form.Field>
        </aside>
      </div>
    </div>
  )
}

/* ── Helper ─────────────────────────────────────────────── */
function SidebarProperty({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
