import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { ROUTES } from '@/shared/constants'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session) redirect(ROUTES.HOME)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {children}
    </div>
  )
}
