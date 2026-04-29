import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ContentType } from '@/shared/types'

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

// Public endpoint — no auth required. Global review discovery for the Explore page.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const contentType = searchParams.get('contentType') as ContentType | null
  const sort = searchParams.get('sort') ?? 'recent'

  // No status filter — all reviews are worth discovering.
  // The create API already prevents want_to_consume reviews.
  const where = {
    ...(contentType && { contentType }),
  }

  const orderBy =
    sort === 'popular'
      ? { reactions: { _count: 'desc' as const } }
      : sort === 'rating_high'
        ? { rating: 'desc' as const }
        : sort === 'rating_low'
          ? { rating: 'asc' as const }
          : { createdAt: 'desc' as const }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: USER_SELECT },
        catalogItem: { select: CATALOG_ITEM_SELECT },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy,
      take: LIMIT,
      skip: (page - 1) * LIMIT,
    }),
    prisma.review.count({ where }),
  ])

  // Map Prisma User fields to the entity shape ReviewCard expects
  const mapped = reviews.map((r) => ({
    ...r,
    user: {
      id: r.user.id,
      username: r.user.username ?? r.user.name,
      displayName: r.user.displayName ?? r.user.name,
      avatarUrl: r.user.image ?? undefined,
    },
  }))

  return NextResponse.json({
    reviews: mapped,
    total,
    page,
    hasMore: page * LIMIT < total,
  })
}
