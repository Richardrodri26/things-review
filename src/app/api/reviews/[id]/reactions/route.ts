import { NextRequest, NextResponse } from 'next/server'
import { requireSession, getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { toggleReactionSchema } from '@/entities/reaction/schema'
import type { ReactionSummary } from '@/entities/reaction/types'

type Params = { params: Promise<{ id: string }> }

async function getReactionSummary(reviewId: string, userId: string | null): Promise<ReactionSummary> {
  const [grouped, userReaction] = await Promise.all([
    prisma.reviewReaction.groupBy({
      by: ['type'],
      where: { reviewId },
      _count: true,
    }),
    userId
      ? prisma.reviewReaction.findUnique({ where: { reviewId_userId: { reviewId, userId } } })
      : null,
  ])

  const likeCount = grouped.find(g => g.type === 'like')?._count ?? 0
  const dislikeCount = grouped.find(g => g.type === 'dislike')?._count ?? 0

  return {
    likeCount,
    dislikeCount,
    userReaction: (userReaction?.type as ReactionSummary['userReaction']) ?? null,
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id: reviewId } = await params
  const session = await getSession()
  const summary = await getReactionSummary(reviewId, session?.user.id ?? null)
  return NextResponse.json(summary)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id: reviewId } = await params
  const body = await req.json()
  const parsed = toggleReactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { type } = parsed.data
  const userId = session.user.id

  const existing = await prisma.reviewReaction.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  })

  if (existing) {
    if (existing.type === type) {
      // Same type — un-react
      await prisma.reviewReaction.delete({ where: { reviewId_userId: { reviewId, userId } } })
    } else {
      // Different type — update
      await prisma.reviewReaction.update({
        where: { reviewId_userId: { reviewId, userId } },
        data: { type },
      })
    }
  } else {
    await prisma.reviewReaction.create({ data: { reviewId, userId, type } })
  }

  const summary = await getReactionSummary(reviewId, userId)
  return NextResponse.json(summary)
}
