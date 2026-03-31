// src/features/groups/components/JoinGroupForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useJoinGroup } from '../hooks'

const joinSchema = z.object({
  inviteCode: z
    .string()
    .length(8, 'Invite code must be 8 characters'),
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
  const t = useTranslations('groups.joinForm')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const joinGroup = useJoinGroup({
    joined: (name) => tToasts('groups.joined', { name }),
    joinedInvalidCode: t('invalidCode'),
    joinedInvalidCodeDescription: tCommon('error'),
    joinedError: tToasts('groups.createdError'),
    joinedErrorDescription: tToasts('tryAgain'),
  })

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
            <Label htmlFor={field.name}>{t('inviteCode')}</Label>
            <Input
              id={field.name}
              placeholder={t('inviteCodePlaceholder')}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoFocus
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
            {joinGroup.isError && (
              <p className="text-xs text-destructive">{t('invalidCode')}</p>
            )}
          </div>
        )}
      </form.Field>

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
