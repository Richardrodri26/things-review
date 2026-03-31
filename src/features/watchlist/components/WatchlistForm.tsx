'use client'

import { useForm } from '@tanstack/react-form'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Spinner } from '@/components/ui/spinner'
import { ContentPicker } from '@/features/reviews/components/ContentPicker'
import type { WatchlistItem, WatchlistPriority } from '@/entities/watchlist/types'
import type { ContentType } from '@/shared/types'
import { useAddToWatchlist, useUpdateWatchlistItem } from '../hooks'

const watchlistFormSchema = z.object({
  contentId:   z.string().min(1, 'Content ID is required'),
  contentType: z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast']),
  priority:    z.enum(['low', 'medium', 'high']),
  note:        z.string().max(500).optional(),
  targetDate:  z.string().optional(),
})

type WatchlistFormData = z.input<typeof watchlistFormSchema>

function getErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return undefined
}

interface WatchlistFormProps {
  mode: 'add' | 'edit'
  item?: WatchlistItem
  initialContentId?: string
  initialContentType?: ContentType
  onSuccess?: () => void
  onCancel?: () => void
}

export function WatchlistForm({
  mode,
  item,
  initialContentId,
  initialContentType,
  onSuccess,
  onCancel,
}: WatchlistFormProps) {
  const t = useTranslations('watchlist.form')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const addToWatchlist = useAddToWatchlist({
    added: tToasts('watchlist.added'),
    addedError: tToasts('watchlist.addedError'),
    addedErrorDescription: tToasts('tryAgain'),
  })
  const updateItem = useUpdateWatchlistItem({
    updated: tToasts('watchlist.updated'),
    updatedError: tToasts('watchlist.updatedError'),
    updatedErrorDescription: tToasts('tryAgain'),
  })

  const targetDateStr = item?.targetDate
    ? new Date(item.targetDate).toISOString().split('T')[0]
    : ''

  const defaultValues: WatchlistFormData = {
    contentId:   initialContentId ?? item?.contentId ?? '',
    contentType: (initialContentType ?? item?.contentType ?? 'movie') as WatchlistFormData['contentType'],
    priority:    item?.priority ?? 'medium',
    note:        item?.note ?? '',
    targetDate:  targetDateStr,
  }

  const form = useForm({
    defaultValues,
    validators: { onSubmit: watchlistFormSchema },
    onSubmit: async ({ value }) => {
      const targetDate = value.targetDate ? new Date(value.targetDate) : undefined

      if (mode === 'add') {
        await addToWatchlist.mutateAsync({
          contentId:   value.contentId,
          contentType: value.contentType as ContentType,
          priority:    value.priority as WatchlistPriority,
          note:        value.note || undefined,
          targetDate,
        })
      } else if (mode === 'edit' && item) {
        await updateItem.mutateAsync({
          id: item.id,
          data: {
            priority:   value.priority as WatchlistPriority,
            note:       value.note || undefined,
            targetDate,
          },
        })
      }

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
    >
      <FieldGroup>
        {/* ContentPicker — solo en modo add */}
        {mode === 'add' && (
          <form.Field name="contentType">
            {(typeField) => (
              <form.Field name="contentId">
                {(idField) => (
                  <Field data-invalid={idField.state.meta.errors.length > 0 || undefined}>
                    <FieldLabel>{t('content')}</FieldLabel>
                    <ContentPicker
                      contentType={typeField.state.value as ContentType}
                      contentId={idField.state.value}
                      onTypeChange={(type) => {
                        typeField.handleChange(type as WatchlistFormData['contentType'])
                        idField.handleChange('')
                      }}
                      onItemChange={(id) => {
                        idField.handleChange(id)
                      }}
                    />
                    <FieldError errors={idField.state.meta.errors.map((e) => ({ message: getErrorMessage(e) }))} />
                  </Field>
                )}
              </form.Field>
            )}
          </form.Field>
        )}

        {/* Priority — ToggleGroup (3 opciones) */}
        <form.Field name="priority">
          {(field) => (
            <Field>
              <FieldLabel>{t('priority')}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[field.state.value]}
                onValueChange={(vals) => {
                  if (vals.length > 0) {
                    field.handleChange(vals[vals.length - 1] as WatchlistFormData['priority'])
                  }
                }}
                className="w-full"
              >
                <ToggleGroupItem value="high" className="flex-1">
                  High
                </ToggleGroupItem>
                <ToggleGroupItem value="medium" className="flex-1">
                  Medium
                </ToggleGroupItem>
                <ToggleGroupItem value="low" className="flex-1">
                  Low
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
          )}
        </form.Field>

        {/* Target Date */}
        <form.Field name="targetDate">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                {t('targetDate')}
              </FieldLabel>
              <FieldDescription>{tCommon('optional')}</FieldDescription>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>

        {/* Note */}
        <form.Field name="note">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
              <FieldLabel htmlFor={field.name}>{t('note')}</FieldLabel>
              <FieldDescription>{t('noteDescription')}</FieldDescription>
              <Textarea
                id={field.name}
                placeholder={t('note')}
                className="resize-none"
                rows={3}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0 || undefined}
              />
              <FieldError errors={field.state.meta.errors.map((e) => ({ message: getErrorMessage(e) }))} />
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      {/* Actions */}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                {tCommon('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {mode === 'add' ? t('submit') : t('saveChanges')}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
