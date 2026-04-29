import { NextRequest, NextResponse } from 'next/server'
import { requireSession, getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import type { UserPublicProfile } from '@/entities/follow/types'

type Params = { params: Promise<{ id: string }> }

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  image: true,
  bio: true,
  createdAt: true,
  _count: {
    select: {
      followers: true,
      following: true,
      reviews: true,
    },
  },
} as const

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()

  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT,
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let isFollowing = false
  if (session?.user && session.user.id !== id) {
    const follow = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: id } },
    })
    isFollowing = !!follow
  }

  const profile: UserPublicProfile = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    image: user.image,
    bio: user.bio,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    reviewCount: user._count.reviews,
    isFollowing,
    createdAt: user.createdAt,
  }

  return NextResponse.json(profile)
}
