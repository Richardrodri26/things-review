// src/features/profile/components/ProfilePage.tsx
'use client'

import { useState } from 'react'
import { PencilIcon, StarIcon, BookOpenIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StatsCard, RatingStars } from '@/shared/ui/atoms'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { useProfile, useUserStats } from '../hooks'
import { ProfileForm } from './ProfileForm'

export function ProfilePage() {
  const { data: user } = useProfile()
  const stats = useUserStats()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

  const initials = user.displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-2xl">
      {/* User Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 rounded-xl">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback className="rounded-xl text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-semibold">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-foreground/80 pt-1">{user.bio}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <PencilIcon />
          Edit Profile
        </Button>
      </div>

      <Separator />

      {/* Stats Overview */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatsCard
            label="Total Reviews"
            value={stats.totalReviews}
            icon={<BookOpenIcon className="size-4" />}
          />
          <StatsCard
            label="Avg Rating"
            value={stats.averageRating !== null ? stats.averageRating : '—'}
            icon={<StarIcon className="size-4" />}
          />
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Rating Breakdown</h2>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((rating) => {
                const count = stats.ratingDistribution[rating]
                const pct = stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <RatingStars value={rating} readonly size="sm" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Reviews by Content Type */}
      {stats.totalReviews > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">By Type</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.entries(stats.reviewsByContentType) as [keyof typeof CONTENT_TYPE_LABELS, number][])
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([contentType, count]) => {
                  const label = CONTENT_TYPE_LABELS[contentType]
                  return (
                    <div key={contentType} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                      <span className="text-lg" aria-hidden>{label.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{count}</p>
                        <p className="text-xs text-muted-foreground">{label.en}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileForm
            user={user}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
