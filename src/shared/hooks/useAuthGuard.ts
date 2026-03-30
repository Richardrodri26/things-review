'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useStore } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'

/**
 * Protege las rutas del (app) route group.
 * - Si hay sesión activa de Better Auth → carga el usuario al store.
 * - Si no hay sesión → redirige a /login (el middleware también lo hace, esto es una segunda capa).
 * Retorna `isReady: boolean` para evitar render antes de verificar.
 */
export function useAuthGuard(): boolean {
  const { data: session, isPending } = useSession()
  const setUser = useStore((s) => s.setUser)
  const router = useRouter()

  useEffect(() => {
    if (isPending) return

    if (!session?.user) {
      router.replace(ROUTES.LOGIN)
      return
    }

    // Mapear la sesión de Better Auth al User del store
    setUser({
      id: session.user.id,
      username: (session.user as { username?: string }).username ?? session.user.name,
      displayName: (session.user as { displayName?: string }).displayName ?? session.user.name,
      avatarUrl: session.user.image ?? undefined,
      bio: (session.user as { bio?: string }).bio,
      createdAt: new Date(session.user.createdAt),
      updatedAt: new Date(session.user.updatedAt ?? session.user.createdAt),
    })
  }, [session, isPending, setUser, router])

  return !isPending && !!session?.user
}
