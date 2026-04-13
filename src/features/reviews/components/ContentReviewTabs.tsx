// src/features/reviews/components/ContentReviewTabs.tsx
'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UsersIcon, StarIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState } from '@/shared/ui/atoms'
import { ReviewCard } from './ReviewCard'
import { useGroups, useGroupReviewsByContent } from '@/features/groups/hooks'
import { useUser } from '@/shared/lib/store'
import { ROUTES } from '@/shared/constants'
import type { ReviewWithUser } from '@/entities/review/types'

type Tab = 'all' | 'group'

interface ContentReviewTabsProps {
  contentId: string
  /** groupId pre-seleccionado (cuando se navega desde GroupDetailPage) */
  defaultGroupId?: string
}

export function ContentReviewTabs({
  contentId,
  defaultGroupId,
}: ContentReviewTabsProps) {
  const t = useTranslations('catalog.reviewTabs')
  const pathname = usePathname()
  const user = useUser()
  const { data: groups = [] } = useGroups()

  const [activeTab, setActiveTab] = useState<Tab>(defaultGroupId ? 'group' : 'all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId ?? '',
  )

  // Fallback: si no hay selección pero hay grupos, usa el primero
  const resolvedGroupId = selectedGroupId || groups[0]?.id || ''

  const { data: rawGroupReviews = [], isLoading: groupLoading } =
    useGroupReviewsByContent(resolvedGroupId, contentId)

  const groupReviews = useMemo(() => {
    if (!user?.id) return rawGroupReviews
    return [...rawGroupReviews].sort((a, b) => {
      if (a.userId === user.id) return -1
      if (b.userId === user.id) return 1
      return 0
    })
  }, [rawGroupReviews, user?.id])

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === resolvedGroupId),
    [groups, resolvedGroupId],
  )

  return (
    <div className="space-y-4">
      {/* ── Tab switcher ── */}
      <ToggleGroup
        variant="outline"
        size="sm"
        value={[activeTab]}
        onValueChange={(vals) => {
          if (vals.length > 0) setActiveTab(vals[vals.length - 1] as Tab)
        }}
        className="w-full grid grid-cols-2"
      >
        <ToggleGroupItem value="all" className="flex items-center gap-1.5 text-xs">
          <StarIcon className="size-3.5" />
          {t('allTab')}
        </ToggleGroupItem>
        <ToggleGroupItem value="group" className="flex items-center gap-1.5 text-xs">
          <UsersIcon className="size-3.5" />
          {t('groupTab')}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* ── Panel: Todas ── */}
      {activeTab === 'all' && (
        <p className="text-xs text-muted-foreground italic">
          {t('allHint')}
        </p>
      )}

      {/* ── Panel: Mis Grupos ── */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="size-5" />}
              title={t('noGroups')}
              description={t('noGroupsDescription')}
            />
          ) : (
            <>
              {/* Group selector */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('selectGroup')}
                </p>
                <Select
                  value={resolvedGroupId}
                  onValueChange={(v) => v && setSelectedGroupId(v)}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder={t('selectGroupPlaceholder')}>
                      {selectedGroup ? (
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                          {selectedGroup.name}
                        </span>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id} className="text-xs">
                        <span className="flex items-center gap-2">
                          <UsersIcon className="size-3.5 text-muted-foreground" />
                          <span>{group.name}</span>
                          <span className="text-muted-foreground/60">
                            · {t('memberCount', { count: group.memberIds.length })}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reviews del grupo para este contenido */}
              {groupLoading ? (
                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-muted animate-pulse aspect-[3/4]"
                    />
                  ))}
                </div>
              ) : groupReviews.length === 0 ? (
                <EmptyState
                  icon={<StarIcon className="size-5" />}
                  title={t('noGroupReviews')}
                  description={t('noGroupReviewsDescription', {
                    group: selectedGroup?.name ?? '',
                  })}
                />
              ) : (
                <div className="space-y-3">
                  <GroupAverageBar reviews={groupReviews} tGroupAverage={(count: number) => t('groupAverage', { count })} />

                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
                    {groupReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        author={review.user}
                        isOwn={review.userId === user?.id}
                        detailHref={`${ROUTES.REVIEW_DETAIL(review.id)}?from=${encodeURIComponent(pathname)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Barra de promedio del grupo ────────────────────────────────────
interface GroupAverageBarProps {
  reviews: ReviewWithUser[]
  tGroupAverage: (count: number) => string
}

function GroupAverageBar({ reviews, tGroupAverage }: GroupAverageBarProps) {
  const rated = reviews.filter((r) => r.rating != null)
  if (rated.length < 2) return null

  const avg = rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
  const avgFormatted = avg % 1 === 0 ? avg.toString() : avg.toFixed(1)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
      {/* Avatars apiladas */}
      <div className="flex -space-x-1.5">
        {reviews.slice(0, 4).map((r, i) => (
          <Avatar key={i} className="size-6 ring-2 ring-background">
            <AvatarImage src={r.user.avatarUrl} alt={r.user.displayName} />
            <AvatarFallback className="text-[9px]">
              {r.user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {reviews.length > 4 && (
          <div className="size-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[9px] font-medium text-muted-foreground">
            +{reviews.length - 4}
          </div>
        )}
      </div>

      {/* Promedio */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-sm font-semibold text-foreground leading-none">
          ★ {avgFormatted}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">
          {tGroupAverage(rated.length)}
        </span>
      </div>
    </div>
  )
}
