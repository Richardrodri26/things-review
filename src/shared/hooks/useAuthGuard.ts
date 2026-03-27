// src/shared/hooks/useAuthGuard.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/shared/lib/store'
import { services } from '@/shared/services'
import { ROUTES } from '@/shared/constants'

/**
 * Protege las rutas del (app) route group.
 * - Si hay usuario en localStorage → lo carga al store.
 * - Si no hay usuario → redirige a /onboarding.
 * Retorna `isReady: boolean` para evitar render antes de verificar.
 */
export function useAuthGuard(): boolean {
  const [isReady, setIsReady] = useState(false)
  const setUser = useStore((s) => s.setUser)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const user = await services.users.get()
      if (!user) {
        router.replace(ROUTES.ONBOARDING)
        return
      }
      setUser(user)
      setIsReady(true)
    }
    check()
  }, [router, setUser])

  return isReady
}
