// src/features/groups/components/GroupDetailPage.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
  UsersIcon,
  LockIcon,
  GlobeIcon,
  TrashIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContentReviewGroup } from '@/features/reviews/components/ContentReviewGroup'
import { useUser } from '@/shared/lib/store'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import { useGroup, useGroupReviews, useDeleteGroup } from '../hooks'
import { GroupRankingList } from './GroupRankingList'
import { GroupMembersSection } from './GroupMembersSection'

type Tab = 'reviews' | 'ranking' | 'members'

interface GroupDetailPageProps {
  groupId: string
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
  const router = useRouter()
  const user = useUser()
  const { data: group, isLoading } = useGroup(groupId)
  const { data: groupReviews = [], isLoading: reviewsLoading } = useGroupReviews(groupId)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('reviews')
  const t = useTranslations('groups.detail')
  const tCard = useTranslations('groups.card')
  const tCommon = useTranslations('common')
  const tContentType = useTranslations('contentType')
  const tToasts = useTranslations('toasts')
  const deleteGroup = useDeleteGroup({
    deleted: tToasts('groups.deleted'),
    deletedError: tToasts('groups.deletedError'),
    deletedErrorDescription: tToasts('tryAgain'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeftIcon />
          {tCommon('back')}
        </Button>
        <p className="text-muted-foreground">{t('notFound')}</p>
      </div>
    )
  }

  const isOwner = group.ownerId === user?.id

  function copyInviteCode() {
    navigator.clipboard.writeText(group!.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    await deleteGroup.mutateAsync(group!.id)
    router.replace(ROUTES.GROUPS)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-3xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit -ml-2">
        <ArrowLeftIcon />
        {t('back')}
      </Button>

      {/* Group Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{group.name}</h1>
            <div className="flex items-center gap-1.5">
              {isOwner && <Badge variant="secondary">{tCard('owner')}</Badge>}
              {group.visibility === 'private' ? (
                <LockIcon className="size-4 text-muted-foreground" />
              ) : (
                <GlobeIcon className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <UsersIcon className="size-3.5" />
            <span>{t('memberCount', { count: group.memberIds.length })}</span>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDelete(true)}
            className="text-destructive hover:text-destructive shrink-0"
            aria-label={t('deleteDialog.ariaLabel')}
          >
            <TrashIcon />
          </Button>
        )}
      </div>

      {/* Focus types */}
      {group.focusContentTypes && group.focusContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {group.focusContentTypes.map((ct) => (
            <span
              key={ct}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {CONTENT_TYPE_LABELS[ct].icon} {tContentType(ct)}
            </span>
          ))}
        </div>
      )}

      {/* Invite Code (owner only) */}
      {isOwner && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('inviteCode')}</p>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono tracking-widest">
                {group.inviteCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                {copied ? tCommon('copied') : tCommon('copy')}
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Tabs */}
      <div>
        <div className="flex gap-1 mb-4 border-b border-border">
          {(['reviews', 'ranking', 'members'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {activeTab === 'reviews' && (
          reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <ContentReviewGroup reviews={groupReviews} groupId={groupId} />
          )
        )}

        {activeTab === 'ranking' && (
          reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <GroupRankingList reviews={groupReviews} />
          )
        )}

        {activeTab === 'members' && (
          <GroupMembersSection
            groupId={groupId}
            groupName={group.name}
            isOwner={isOwner}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', { name: group.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? tCommon('deleting') : t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
