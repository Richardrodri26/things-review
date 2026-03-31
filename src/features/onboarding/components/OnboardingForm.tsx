// src/features/onboarding/components/OnboardingForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('onboarding')
  const tCommon = useTranslations('common')

  const defaultValues: FormData = {
    username: '',
    displayName: '',
    bio: '',
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: onboardingSchema },
    onSubmit: async ({ value }) => {
      const user = await services.users.update({
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
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
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
                <Label htmlFor={field.name}>{t('form.displayName')}</Label>
                <Input
                  id={field.name}
                  placeholder={t('form.displayNamePlaceholder')}
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
                <Label htmlFor={field.name}>{t('form.username')}</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">@</span>
                  <Input
                    id={field.name}
                    placeholder={t('form.usernamePlaceholder')}
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
                  {t('form.bio')} <span className="text-muted-foreground">({tCommon('optional')})</span>
                </Label>
                <Textarea
                  id={field.name}
                  placeholder={t('form.bioPlaceholder')}
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
                {isSubmitting ? t('form.submitting') : t('form.submit')}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  )
}
