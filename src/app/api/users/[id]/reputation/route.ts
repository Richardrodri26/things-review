import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const [reviewReactions, commentReactions, reviewCount] = await Promise.all([
    prisma.reviewReaction.groupBy({
      by: ['type'],
      where: { review: { userId: id } },
      _count: true,
    }),
    prisma.commentReaction.groupBy({
      by: ['type'],
      where: { comment: { authorId: id } },
      _count: true,
    }),
    prisma.review.count({ where: { userId: id } }),
  ])

  const reviewLikes = reviewReactions.find((r) => r.type === 'like')?._count ?? 0
  const reviewDislikes = reviewReactions.find((r) => r.type === 'dislike')?._count ?? 0
  const commentLikes = commentReactions.find((r) => r.type === 'like')?._count ?? 0
  const commentDislikes = commentReactions.find((r) => r.type === 'dislike')?._count ?? 0

  const score = Math.max(
    0,
    reviewLikes * 3 +
      commentLikes * 1 -
      reviewDislikes * 2 -
      commentDislikes * 0.5 +
      reviewCount * 2
  )

  const tier =
    score >= 500
      ? 'legend'
      : score >= 150
        ? 'expert'
        : score >= 50
          ? 'enthusiast'
          : score >= 10
            ? 'contributor'
            : 'newbie'

  return NextResponse.json({
    score,
    tier,
    breakdown: { reviewLikes, reviewDislikes, commentLikes, commentDislikes, totalReviews: reviewCount },
  })
}
