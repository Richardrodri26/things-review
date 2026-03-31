// src/features/profile/components/ProfileForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('profile.form')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const updateProfile = useUpdateProfile({
    updated: tToasts('profile.updated'),
    updatedError: tToasts('profile.updatedError'),
    updatedErrorDescription: tToasts('tryAgain'),
  })

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
            <Label htmlFor={field.name}>{t('displayName')}</Label>
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
              {t('avatarUrl')} <span className="text-muted-foreground">({tCommon('optional')})</span>
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
              {t('bio')} <span className="text-muted-foreground">({tCommon('optional')})</span>
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
                {tCommon('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
