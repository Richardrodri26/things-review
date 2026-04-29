import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

const LIMIT = 20

const USER_SELECT = {
  id: true,
  name: true,
  username: true,
  displayName: true,
  image: true,
} as const

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  // Get IDs of users the current user follows
  const follows = await prisma.userFollow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  })

  if (follows.length === 0) {
    return NextResponse.json({ reviews: [], total: 0, page, hasMore: false })
  }

  const followedIds = follows.map((f) => f.followingId)
  const where = { userId: { in: followedIds }, status: 'published' }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: USER_SELECT },
        catalogItem: { select: CATALOG_ITEM_SELECT },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      skip: (page - 1) * LIMIT,
    }),
    prisma.review.count({ where }),
  ])

  return NextResponse.json({
    reviews,
    total,
    page,
    hasMore: page * LIMIT < total,
  })
}
