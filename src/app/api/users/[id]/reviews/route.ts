import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  contentType: true,
  year: true,
} as const

// Returns public reviews for a user profile page.
// If the requester is the owner, also includes private reviews.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const session = await getSession()
  const isOwner = session?.user?.id === userId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId,
    // Exclude want_to_consume — those are watchlist territory
    NOT: { status: 'want_to_consume' },
  }

  if (!isOwner) {
    where.visibility = 'public'
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      catalogItem: { select: CATALOG_ITEM_SELECT },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}
