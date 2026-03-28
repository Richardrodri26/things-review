// src/features/groups/hooks/useGroupMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useStore } from '@/shared/lib/store'
import { useUser } from '@/shared/lib/store'
import type { CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import { GROUPS_QUERY_KEY } from './useGroups'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const addGroup = useStore((s) => s.addGroup)
  const user = useUser()

  return useMutation({
    mutationFn: (data: CreateGroupDTO) => {
      if (!user) throw new Error('No user')
      return services.groups.create(data, user.id)
    },
    onSuccess: (newGroup) => {
      addGroup(newGroup)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  const updateGroup = useStore((s) => s.updateGroup)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDTO }) =>
      services.groups.update(id, data),
    onSuccess: (updatedGroup) => {
      updateGroup(updatedGroup.id, updatedGroup)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  const removeGroup = useStore((s) => s.removeGroup)

  return useMutation({
    mutationFn: (id: string) => services.groups.delete(id),
    onSuccess: (_, id) => {
      removeGroup(id)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()
  const addGroup = useStore((s) => s.addGroup)
  const user = useUser()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('No user')
      const group = await services.groups.getByInviteCode(inviteCode)
      if (!group) throw new Error('Invalid invite code')
      await services.groups.addMember(group.id, user.id)
      return group
    },
    onSuccess: (group) => {
      addGroup(group)
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
    },
  })
}
