'use client'

import { useTranslations } from 'next-intl'
import { UsersIcon, BookOpenIcon, UserXIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FollowButton, ReputationBadge } from '@/shared/ui/atoms'
import { useUserProfile } from '@/features/follow'
import { useReputation } from '@/features/reputation'
import { useSession } from '@/lib/auth-client'

interface PublicProfilePageProps {
  userId: string
}

export function PublicProfilePage({ userId }: PublicProfilePageProps) {
  const t = useTranslations('follow')
  const { data: profile, isLoading, isError } = useUserProfile(userId)
  const { data: reputation } = useReputation(userId)
  const { data: session } = useSession()
  const isOwnProfile = session?.user?.id === userId
  const isAuthenticated = !!session?.user

  if (isLoading) return <PublicProfileSkeleton />
  if (isError || !profile) return <ProfileNotFound />

  const displayName = profile.displayName ?? profile.username ?? profile.id.slice(0, 8)
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 rounded-xl">
          <AvatarImage src={profile.image ?? undefined} alt={displayName} />
          <AvatarFallback className="rounded-xl text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold truncate">{displayName}</h1>
            {reputation && (
              <ReputationBadge score={reputation.score} tier={reputation.tier} variant="inline" />
            )}
          </div>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-foreground/80 pt-1 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {!isOwnProfile && (
          <FollowButton
            userId={userId}
            disabled={!isAuthenticated}
          />
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <UsersIcon className="size-4" />
          <span>
            <strong className="text-foreground font-semibold">{profile.followerCount}</strong>{' '}
            {t('followers')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <UsersIcon className="size-4" />
          <span>
            <strong className="text-foreground font-semibold">{profile.followingCount}</strong>{' '}
            {t('following')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BookOpenIcon className="size-4" />
          <span>
            <strong className="text-foreground font-semibold">{profile.reviewCount}</strong>{' '}
            reviews
          </span>
        </div>
      </div>

      <Separator />
    </div>
  )
}

function ProfileNotFound() {
  const t = useTranslations('follow')
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center max-w-2xl">
      <UserXIcon className="size-12 text-muted-foreground/50" />
      <h2 className="text-lg font-semibold">{t('notFound')}</h2>
      <p className="text-sm text-muted-foreground">{t('notFoundDescription')}</p>
    </div>
  )
}
function PublicProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-2xl">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}
