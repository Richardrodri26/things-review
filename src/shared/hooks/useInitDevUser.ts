'use client'

import { useEffect } from 'react'
import { useStore } from '@/shared/lib/store'
import { services } from '@/shared/services'

/**
 * DEV ONLY: Siembra un usuario en localStorage si no hay ninguno.
 * Reemplazar en Sprint 3 con el onboarding real.
 */
export function useInitDevUser() {
  const setUser = useStore((s) => s.setUser)

  useEffect(() => {
    async function init() {
      const existing = await services.users.get()
      if (existing) {
        setUser(existing)
        return
      }
      // Crear usuario de desarrollo
      const devUser = await services.users.create({
        username: 'devuser',
        displayName: 'Dev User',
      })
      setUser(devUser)
    }
    init()
  }, [setUser])
}
