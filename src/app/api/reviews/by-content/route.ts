import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

// GET /api/reviews/by-content?contentId=xxx&memberIds=id1,id2&groupId=xxx
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const contentId = searchParams.get('contentId')
  const memberIds = searchParams.get('memberIds')?.split(',').filter(Boolean)
  const groupId = searchParams.get('groupId')

  if (!contentId) {
    return NextResponse.json({ error: 'contentId is required' }, { status: 400 })
  }

  const reviews = await prisma.review.findMany({
    where: {
      contentId,
      ...(memberIds?.length ? { userId: { in: memberIds } } : { userId: session.user.id }),
    },
    include: groupId
      ? {
          user: { select: { id: true, username: true, displayName: true, image: true } },
          catalogItem: { select: CATALOG_ITEM_SELECT },
          comments: {
            where: { groupId },
            include: {
              author: { select: { id: true, username: true, displayName: true, image: true } },
            },
          },
        }
      : {
          user: { select: { id: true, username: true, displayName: true, image: true } },
          catalogItem: { select: CATALOG_ITEM_SELECT },
        },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
}
