import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

// GET /api/groups/[id]/reviews — all reviews from group members
// Supports optional ?contentId=xxx to filter by a specific content item
export async function GET(req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const contentId = req.nextUrl.searchParams.get('contentId') ?? undefined

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  })

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: id },
    select: { userId: true },
  })
  const memberIds = memberships.map((m) => m.userId)

  const reviews = await prisma.review.findMany({
    where: {
      userId: { in: memberIds },
      ...(contentId ? { contentId } : {}),
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, image: true } },
      catalogItem: { select: CATALOG_ITEM_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Map Prisma `image` field to app-layer `avatarUrl`
  const mapped = reviews.map(({ user, catalogItem, ...review }) => ({
    ...review,
    catalogItem: catalogItem ?? null,
    user: {
      id: user.id,
      username: user.username ?? '',
      displayName: user.displayName ?? user.username ?? '',
      avatarUrl: user.image ?? undefined,
    },
  }))

  return NextResponse.json(mapped)
}
