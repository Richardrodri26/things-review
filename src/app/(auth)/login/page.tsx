import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/features/auth/components/LoginForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('loginTitle'),
    description: t('loginDescription'),
    robots: { index: true, follow: true },
  }
}

export default function LoginPage() {
  return <LoginForm />
}
