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
      where: { followerId: id },
      include: {
        following: {
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
    prisma.userFollow.count({ where: { followerId: id } }),
  ])

  const currentUserId = session?.user?.id ?? null

  const users = await Promise.all(
    follows.map(async (f) => {
      const isFollowing = currentUserId
        ? !!(await prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: f.following.id,
              },
            },
          }))
        : false

      return {
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.displayName,
        image: f.following.image,
        bio: f.following.bio,
        followerCount: f.following._count.followers,
        followingCount: f.following._count.following,
        reviewCount: f.following._count.reviews,
        isFollowing,
        createdAt: f.following.createdAt,
      }
    })
  )

  return NextResponse.json({ users, total, page, hasMore: skip + PAGE_SIZE < total })
}
