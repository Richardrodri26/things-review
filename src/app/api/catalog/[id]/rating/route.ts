import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const reviews = await prisma.review.findMany({
    where: { catalogItemId: id, rating: { not: null } },
    select: { rating: true },
  })

  if (reviews.length === 0) {
    return NextResponse.json({ averageRating: null, totalReviews: 0, ratingDistribution: {} })
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0

  for (const { rating } of reviews) {
    if (rating !== null) {
      const rounded = Math.round(rating) as 1 | 2 | 3 | 4 | 5
      distribution[rounded] = (distribution[rounded] ?? 0) + 1
      sum += rating
    }
  }

  const averageRating = Math.round((sum / reviews.length) * 10) / 10

  return NextResponse.json({
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  })
}
