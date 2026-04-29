import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const PAGE_SIZE = 20

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSession()

  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
  const skip = (page - 1) * PAGE_SIZE

  const [follows, total] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
            bio: true,
            createdAt: true,
            _count: { select: { followers: true, following: true, reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.userFollow.count({ where: { followingId: id } }),
  ])

  const currentUserId = session?.user?.id ?? null

  const users = await Promise.all(
    follows.map(async (f) => {
      const isFollowing = currentUserId
        ? !!(await prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: f.follower.id,
              },
            },
          }))
        : false

      return {
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.displayName,
        image: f.follower.image,
        bio: f.follower.bio,
        followerCount: f.follower._count.followers,
        followingCount: f.follower._count.following,
        reviewCount: f.follower._count.reviews,
        isFollowing,
        createdAt: f.follower.createdAt,
      }
    })
  )

  return NextResponse.json({ users, total, page, hasMore: skip + PAGE_SIZE < total })
}
