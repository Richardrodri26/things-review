'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2Icon, UserPlusIcon, UserCheckIcon, UserMinusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToggleFollow, useFollowStatus } from '@/features/follow'

interface FollowButtonProps {
  userId: string
  disabled?: boolean
  className?: string
}

export function FollowButton({ userId, disabled, className }: FollowButtonProps) {
  const t = useTranslations('follow')
  const [isHovering, setIsHovering] = useState(false)
  const { isFollowing, followerCount: _ } = useFollowStatus(userId)
  const toggle = useToggleFollow(userId)

  const isLoading = toggle.isPending

  function getLabel() {
    if (isLoading) return null
    if (!isFollowing) return t('follow')
    if (isHovering) return t('unfollow')
    return t('following')
  }

  function getIcon() {
    if (isLoading) return <Loader2Icon className="size-3.5 animate-spin" />
    if (!isFollowing) return <UserPlusIcon className="size-3.5" />
    if (isHovering) return <UserMinusIcon className="size-3.5" />
    return <UserCheckIcon className="size-3.5" />
  }

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'default'}
      disabled={disabled || isLoading}
      onClick={() => toggle.mutate()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        'gap-1.5 transition-all',
        isFollowing && isHovering && 'border-destructive text-destructive hover:bg-destructive/10',
        className,
      )}
      aria-label={isFollowing ? t('unfollow') : t('follow')}
    >
      {getIcon()}
      {getLabel()}
    </Button>
  )
}
