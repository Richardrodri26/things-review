// src/features/groups/components/GroupMembersSection.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOutIcon, UsersIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import { ROUTES } from '@/shared/constants'
import { useGroupMembers, useLeaveGroup } from '../hooks'
import type { GroupMember } from '../hooks'

interface GroupMembersSectionProps {
  groupId: string
  groupName: string
  isOwner: boolean
}

export function GroupMembersSection({ groupId, groupName, isOwner }: GroupMembersSectionProps) {
  const router = useRouter()
  const { data: members = [], isLoading } = useGroupMembers(groupId)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const t = useTranslations('groups.detail')
  const tToasts = useTranslations('toasts')
  const tCommon = useTranslations('common')

  const leaveGroup = useLeaveGroup({
    left: tToasts('groups.left'),
    leftError: tToasts('groups.leftError'),
    leftErrorDescription: tToasts('tryAgain'),
  })

  async function handleLeave() {
    await leaveGroup.mutateAsync(groupId)
    router.replace(ROUTES.GROUPS)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="size-6" />}
        title={t('members.empty')}
        description={t('members.emptyDescription')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {members.map((member) => (
          <MemberCard key={member.userId} member={member} />
        ))}
      </div>

      {!isOwner && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmLeave(true)}
          >
            <LogOutIcon className="size-4" />
            {t('members.leaveGroup')}
          </Button>

          <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{t('members.leaveDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('members.leaveDialog.description', { name: groupName })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={leaveGroup.isPending}
                >
                  {leaveGroup.isPending ? tCommon('loading') : t('members.leaveDialog.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: GroupMember }) {
  const t = useTranslations('groups.detail')
  const tCard = useTranslations('groups.card')
  const initials = member.user.displayName.slice(0, 2).toUpperCase()
  const date = new Date(member.joinedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={member.user.avatarUrl} alt={member.user.displayName} />
        <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-medium truncate">{member.user.displayName}</p>
          {member.role === 'owner' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {tCard('owner')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          @{member.user.username} · {t('members.joined', { date })}
        </p>
      </div>
    </div>
  )
}
