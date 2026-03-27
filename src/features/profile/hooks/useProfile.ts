// src/features/profile/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'

export const PROFILE_QUERY_KEY = ['profile'] as const

export function useProfile() {
  const user = useUser()

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => services.users.get(),
    enabled: !!user,
    // El usuario ya está en el store — esto mantiene TanStack Query en sync
    initialData: user ?? undefined,
  })
}
