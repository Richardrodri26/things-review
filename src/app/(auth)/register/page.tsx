import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo')
  return {
    title: t('registerTitle'),
    description: t('registerDescription'),
    robots: { index: true, follow: true },
  }
}

export default function RegisterPage() {
  return <RegisterForm />
}
