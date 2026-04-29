import { NextRequest, NextResponse } from 'next/server'
import { requireSession, getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { toggleReactionSchema } from '@/entities/reaction/schema'
import type { ReactionSummary } from '@/entities/reaction/types'

type Params = { params: Promise<{ id: string }> }

async function getReactionSummary(commentId: string, userId: string | null): Promise<ReactionSummary> {
  const [grouped, userReaction] = await Promise.all([
    prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: true,
    }),
    userId
      ? prisma.commentReaction.findUnique({ where: { commentId_userId: { commentId, userId } } })
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
  const { id: commentId } = await params
  const session = await getSession()
  const summary = await getReactionSummary(commentId, session?.user.id ?? null)
  return NextResponse.json(summary)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id: commentId } = await params
  const body = await req.json()
  const parsed = toggleReactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { type } = parsed.data
  const userId = session.user.id

  const existing = await prisma.commentReaction.findUnique({
    where: { commentId_userId: { commentId, userId } },
  })

  if (existing) {
    if (existing.type === type) {
      await prisma.commentReaction.delete({ where: { commentId_userId: { commentId, userId } } })
    } else {
      await prisma.commentReaction.update({
        where: { commentId_userId: { commentId, userId } },
        data: { type },
      })
    }
  } else {
    await prisma.commentReaction.create({ data: { commentId, userId, type } })
  }

  const summary = await getReactionSummary(commentId, userId)
  return NextResponse.json(summary)
}
