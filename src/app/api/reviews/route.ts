import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { createReviewDTOSchema } from '@/entities/review/schema'

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const contentType = searchParams.get('contentType')
  const status = searchParams.get('status')

  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
      ...(contentType && { contentType }),
      ...(status && { status }),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = await req.json()
  const parsed = createReviewDTOSchema.safeParse({ ...body, userId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { userId, contentId, contentType, rating, title, body: reviewBody,
    containsSpoilers, status: reviewStatus, metadata, consumedAt } = parsed.data

  if (reviewStatus === 'want_to_consume') {
    return NextResponse.json(
      { error: 'A review cannot have status "want_to_consume". Use consumed, consuming, or dropped.' },
      { status: 422 }
    )
  }

  // Auto-resolver catalogItemId si el contentId corresponde a un CatalogItem en DB
  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: contentId } })

  const review = await prisma.review.create({
    data: {
      userId,
      contentId,
      contentType,
      rating,
      title,
      body: reviewBody as object,
      containsSpoilers,
      status: reviewStatus,
      metadata: metadata as object,
      consumedAt,
      ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  return NextResponse.json(review, { status: 201 })
}
