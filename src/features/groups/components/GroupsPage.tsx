// src/features/groups/components/GroupsPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, UsersIcon, KeyRoundIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import { useUser } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'
import { useGroups } from '../hooks'
import { GroupCard } from './GroupCard'
import { GroupForm } from './GroupForm'
import { JoinGroupForm } from './JoinGroupForm'

type DialogMode = 'none' | 'create' | 'join'

export function GroupsPage() {
  const router = useRouter()
  const user = useUser()
  const { data: groups = [], isLoading } = useGroups()
  const [dialog, setDialog] = useState<DialogMode>('none')

  function handleGroupCreated(groupId: string) {
    setDialog('none')
    router.push(ROUTES.GROUP_DETAIL(groupId))
  }

  function handleGroupJoined(groupId: string) {
    setDialog('none')
    router.push(ROUTES.GROUP_DETAIL(groupId))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Groups</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialog('join')}>
            <KeyRoundIcon />
            Join
          </Button>
          <Button size="sm" onClick={() => setDialog('create')}>
            <PlusIcon />
            Create Group
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-6" />}
          title="No groups yet"
          description="Create a group or join one with an invite code."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialog('join')}>
                <KeyRoundIcon />
                Join with code
              </Button>
              <Button size="sm" onClick={() => setDialog('create')}>
                <PlusIcon />
                Create Group
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isOwner={group.ownerId === user?.id}
            />
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <GroupForm
            onSuccess={handleGroupCreated}
            onCancel={() => setDialog('none')}
          />
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={dialog === 'join'} onOpenChange={(open) => !open && setDialog('none')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join a Group</DialogTitle>
          </DialogHeader>
          <JoinGroupForm
            onSuccess={handleGroupJoined}
            onCancel={() => setDialog('none')}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
