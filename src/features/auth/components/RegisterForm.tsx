'use client'

import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { signUp } from '@/lib/auth-client'
import { toast } from '@/shared/lib/toast'
import { services } from '@/shared/services'
import { ROUTES } from '@/shared/constants'

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(50, 'Max 50 characters'),
    username: z
      .string()
      .min(3, 'At least 3 characters')
      .max(30, 'Max 30 characters')
      .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

export function RegisterForm() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')

  const form = useForm({
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '', username: '' },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      // 1. Crear cuenta con Better Auth
      const result = await signUp.email({
        email: value.email,
        password: value.password,
        name: value.displayName,
      })

      if (result.error) {
        toast.error({
          title: tToasts('auth.registerError'),
          description: result.error.message ?? tToasts('tryAgain'),
        })
        return
      }

      // 2. Guardar username y displayName via PATCH /api/me
      try {
        await services.users.update({
          username: value.username,
          displayName: value.displayName,
        })
      } catch (err) {
        toast.error({
          title: tToasts('auth.updateProfileError'),
          description: err instanceof Error ? err.message : tToasts('tryAgain'),
        })
        return
      }

      router.replace(ROUTES.HOME)
    },
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('register.title')}</CardTitle>
        <CardDescription>{t('register.description')}</CardDescription>
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
          <form.Field name="displayName">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('register.displayName')}</Label>
                <Input
                  id={field.name}
                  placeholder={t('register.displayNamePlaceholder')}
                  autoComplete="name"
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

          <form.Field name="username">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('register.username')}</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    id={field.name}
                    placeholder={t('register.usernamePlaceholder')}
                    className="pl-7"
                    autoComplete="username"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                    onBlur={field.handleBlur}
                  />
                </div>
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('register.email')}</Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('register.password')}</Label>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('register.confirmPassword')}</Label>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.isTouched && (
                  <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? tCommon('loading') : t('register.submit')}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('register.hasAccount')}&nbsp;
        <Link href={ROUTES.LOGIN} className="underline text-foreground">
          {t('register.login')}
        </Link>
      </CardFooter>
    </Card>
  )
}
