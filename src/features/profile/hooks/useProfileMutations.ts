// src/features/profile/hooks/useProfileMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { UpdateUserDTO } from '@/entities/user/types'
import { PROFILE_QUERY_KEY } from './useProfile'

export interface ProfileToastMessages {
  updated?: string
  updatedError?: string
  updatedErrorDescription?: string
}

export function useUpdateProfile(messages?: ProfileToastMessages) {
  const queryClient = useQueryClient()
  const setUser = useStore((s) => s.setUser)

  return useMutation({
    mutationFn: (data: UpdateUserDTO) => services.users.update(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      toast.success({ title: messages?.updated ?? 'Profile updated' })
    },
    onError: () => {
      toast.error({
        title: messages?.updatedError ?? 'Could not update profile',
        description: messages?.updatedErrorDescription ?? 'Please try again.',
      })
    },
  })
}
