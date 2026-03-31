'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import type { OutputData } from '@editorjs/editorjs'
import { PencilIcon, AlertTriangleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const reviewFormSchema = z.object({
  contentId:        z.string().min(1, 'Content is required'),
  contentType:      z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast']),
  rating:           z.number().min(1).max(5).optional(),
  title:            z.string().max(100).optional(),
  body:             z.object({ blocks: z.array(z.any()) }).optional(),
  containsSpoilers: z.boolean(),
  status:           z.enum(['consumed', 'want_to_consume', 'consuming', 'dropped']),
})

type ReviewFormData = z.input<typeof reviewFormSchema>

function getErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    // ZodIssue from @tanstack/react-form + zod validator
    if ('message' in error) return String((error as { message: unknown }).message)
  }
  return undefined
}

export function ReviewForm({ mode, initialValues, review, onSuccess, onCancel }: ReviewFormProps) {
  const t = useTranslations('reviews')
  const tCommon = useTranslations('common')
  const tStatusOptions = useTranslations('reviews.editor.statusOptions')
  const user = useUser()
  const createReview = useCreateReview()
  const updateReview = useUpdateReview()

  // ── Content lock — solo relevante en modo edit ───────────
  const isEditMode = mode === 'edit'
  const [contentLocked, setContentLocked] = useState(isEditMode)
  const [contentIdError, setContentIdError] = useState<string | undefined>()

  // El tipo/id original de la review cuando está locked
  const lockedContentType = review?.contentType ?? initialValues?.contentType
  const lockedContentId   = review?.contentId   ?? initialValues?.contentId
  const lockedItem = useCatalogItem(lockedContentType ?? null, lockedContentId ?? '')

  const defaultValues: ReviewFormData = {
    contentId:        initialValues?.contentId ?? review?.contentId ?? '',
    contentType:      initialValues?.contentType ?? review?.contentType ?? 'movie',
    rating:           initialValues?.rating ?? review?.rating,
    title:            initialValues?.title ?? review?.title,
    body:             (initialValues?.body ?? review?.body) as OutputData | undefined,
    containsSpoilers: initialValues?.containsSpoilers ?? review?.containsSpoilers ?? false,
    status:           initialValues?.status ?? review?.status ?? 'consumed',
  }

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: reviewFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return

      // contentId manual check (ContentPicker doesn't trigger field validators)
      if (!value.contentId) {
        setContentIdError('Content is required')
        return
      }

      setContentIdError(undefined)
      const formValues = value as ReviewFormValues

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
          title: 'Failed to save review',
          description: 'Something went wrong. Please try again.',
        })
      }
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
      {/* Content picker — tipo + item del catálogo en 2 pasos */}
      <div className="space-y-1.5">
        <Label>{t('form.content')}</Label>

        {isEditMode && contentLocked ? (
          /* Locked — muestra el contenido actual con botón de cambio */
          <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5">
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
              title="Change content"
            >
              <PencilIcon className="size-3" />
            </button>
          </div>
        ) : isEditMode && !contentLocked ? (
          /* Unlocked en edit — picker + advertencia */
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon className="size-3 shrink-0" />
              <span>{t('editor.reassignWarning')}</span>
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
                      />
                      {contentIdError && (
                        <p className="text-xs text-destructive">{contentIdError}</p>
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
                form.setFieldValue('contentId',   lockedContentId   ?? '')
                form.setFieldValue('contentType', (lockedContentType ?? 'movie') as ReviewFormData['contentType'])
                setContentIdError(undefined)
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              {t('editor.cancelChange')}
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
                    />
                    {contentIdError && (
                      <p className="text-xs text-destructive">{contentIdError}</p>
                    )}
                  </>
                )}
              </form.Field>
            )}
          </form.Field>
        )}
      </div>

      {/* Status */}
      <form.Field name="status">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>{t('form.status')}</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => v && field.handleChange(v as ReviewFormValues['status'])}
            >
              <SelectTrigger
                id={field.name}
                className={cn('w-full', field.state.meta.errors.length > 0 && 'border-destructive')}
              >
                <SelectValue placeholder={t('form.status')}>
                  {(v: string | null) => v ? tStatusOptions(v as Parameters<typeof tStatusOptions>[0]) : t('form.status')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumed">{t('editor.statusOptions.consumed')}</SelectItem>
                <SelectItem value="want_to_consume">{t('editor.statusOptions.want_to_consume')}</SelectItem>
                <SelectItem value="consuming">{t('editor.statusOptions.consuming')}</SelectItem>
                <SelectItem value="dropped">{t('editor.statusOptions.dropped')}</SelectItem>
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Rating */}
      <form.Field name="rating">
        {(field) => (
          <div className="space-y-1.5">
            <Label>{t('form.rating')}</Label>
            <RatingStars
              value={field.state.value}
              onChange={(r: Rating) => field.handleChange(r)}
              size="lg"
              showValue
            />
          </div>
        )}
      </form.Field>

      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              {t('form.title')} <span className="text-muted-foreground">({tCommon('optional')})</span>
            </Label>
            <Input
              id={field.name}
              placeholder="Give your review a title..."
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Body — EditorJS */}
      <form.Field name="body">
        {(field) => (
          <div className="space-y-1.5">
            <Label>
              {t('form.review')} <span className="text-muted-foreground">({tCommon('optional')})</span>
            </Label>
            <div className="min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
              <EditorClient
                defaultValue={field.state.value as OutputData | undefined}
                onChange={(data) => field.handleChange(data)}
                placeholder="Write your thoughts..."
              />
            </div>
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <form.Subscribe selector={(state) => [state.isSubmitting] as const}>
        {([isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                {tCommon('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon('saving') : mode === 'create' ? t('form.addReview') : t('form.saveChanges')}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
