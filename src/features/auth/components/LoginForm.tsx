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
import { signIn } from '@/lib/auth-client'
import { ROUTES } from '@/shared/constants'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormData = z.input<typeof loginSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

export function LoginForm() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      const result = await signIn.email({
        email: value.email,
        password: value.password,
      })

      if (result.error) {
        throw new Error(result.error.message ?? t('login.error'))
      }

      router.replace(ROUTES.HOME)
    },
  })

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
        <CardDescription>{t('login.description')}</CardDescription>
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
          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('login.email')}</Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
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

          <form.Field name="password">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>{t('login.password')}</Label>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
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

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting, s.errors] as const}>
            {([canSubmit, isSubmitting, errors]) => (
              <>
                {errors.length > 0 && (
                  <p className="text-sm text-destructive">{String(errors[0])}</p>
                )}
                <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? tCommon('loading') : t('login.submit')}
                </Button>
              </>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('login.noAccount')}&nbsp;
        <Link href={ROUTES.REGISTER} className="underline text-foreground">
          {t('login.register')}
        </Link>
      </CardFooter>
    </Card>
  )
}
