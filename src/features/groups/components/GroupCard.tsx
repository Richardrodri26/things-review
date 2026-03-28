// src/features/groups/components/GroupCard.tsx
import Link from 'next/link'
import { UsersIcon, LockIcon, GlobeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { ROUTES } from '@/shared/constants'
import type { Group } from '@/entities/group/types'

interface GroupCardProps {
  group: Group
  isOwner: boolean
}

export function GroupCard({ group, isOwner }: GroupCardProps) {
  return (
    <Link
      href={ROUTES.GROUP_DETAIL(group.id)}
      className="block rounded-lg border border-border bg-card p-4 space-y-3 hover:bg-muted/40 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug truncate">{group.name}</h3>
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwner && (
            <Badge variant="secondary" className="text-[10px]">Owner</Badge>
          )}
          {group.visibility === 'private' ? (
            <LockIcon className="size-3.5 text-muted-foreground" />
          ) : (
            <GlobeIcon className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Focus types */}
      {group.focusContentTypes && group.focusContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.focusContentTypes.map((ct) => (
            <span key={ct} className="text-base" title={CONTENT_TYPE_LABELS[ct].en} aria-label={CONTENT_TYPE_LABELS[ct].en}>
              {CONTENT_TYPE_LABELS[ct].icon}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <UsersIcon className="size-3.5" />
        <span>{group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}</span>
      </div>
    </Link>
  )
}
