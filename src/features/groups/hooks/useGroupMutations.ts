// src/features/groups/hooks/useGroupMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import { apiDelete } from '@/shared/services/api/api-client'
import type { CreateGroupDTO, UpdateGroupDTO } from '@/entities/group/types'
import { GROUPS_QUERY_KEY } from './useGroups'

export interface GroupToastMessages {
  created?: string | ((name: string) => string)
  createdError?: string
  createdErrorDescription?: string
  updated?: string
  updatedError?: string
  updatedErrorDescription?: string
  deleted?: string
  deletedError?: string
  deletedErrorDescription?: string
  joined?: string | ((name: string) => string)
  joinedInvalidCode?: string
  joinedInvalidCodeDescription?: string
  joinedError?: string
  joinedErrorDescription?: string
}

export function useCreateGroup(messages?: GroupToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  return useMutation({
    mutationFn: (data: CreateGroupDTO) => {
      if (!user) throw new Error('No user')
      return services.groups.create(data, user.id)
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
      const title =
        typeof messages?.created === 'function'
          ? messages.created(newGroup.name)
          : messages?.created ?? `Group "${newGroup.name}" created`
      toast.success({ title })
    },
    onError: () => {
      toast.error({
        title: messages?.createdError ?? 'Could not create group',
        description: messages?.createdErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useUpdateGroup(messages?: GroupToastMessages) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDTO }) =>
      services.groups.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
      toast.success({ title: messages?.updated ?? 'Group updated' })
    },
    onError: () => {
      toast.error({
        title: messages?.updatedError ?? 'Could not update group',
        description: messages?.updatedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useDeleteGroup(messages?: GroupToastMessages) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => services.groups.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
      toast.success({ title: messages?.deleted ?? 'Group deleted' })
    },
    onError: () => {
      toast.error({
        title: messages?.deletedError ?? 'Could not delete group',
        description: messages?.deletedErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useLeaveGroup(messages?: {
  left?: string
  leftError?: string
  leftErrorDescription?: string
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => apiDelete(`/groups/${groupId}/members`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
      toast.success({ title: messages?.left ?? 'You left the group' })
    },
    onError: () => {
      toast.error({
        title: messages?.leftError ?? 'Could not leave group',
        description: messages?.leftErrorDescription ?? 'Please try again.',
      })
    },
  })
}

export function useJoinGroup(messages?: GroupToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('No user')
      return services.groups.joinByInviteCode(inviteCode)
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
      const title =
        typeof messages?.joined === 'function'
          ? messages.joined(group.name)
          : messages?.joined ?? `Joined "${group.name}"`
      toast.success({ title })
    },
    onError: (err) => {
      const isInvalidCode =
        err instanceof Error && err.message === 'Invalid invite code'
      toast.error({
        title: isInvalidCode
          ? (messages?.joinedInvalidCode ?? 'Invalid invite code')
          : (messages?.joinedError ?? 'Could not join group'),
        description: isInvalidCode
          ? (messages?.joinedInvalidCodeDescription ?? 'Check the code and try again.')
          : (messages?.joinedErrorDescription ?? 'Please try again.'),
      })
    },
  })
}
