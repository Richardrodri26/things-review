import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { updateReviewDTOSchema } from '@/entities/review/schema'

type Params = { params: Promise<{ id: string }> }

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const review = await prisma.review.findUnique({
    where: { id },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  if (review.userId !== session.user.id) {
    const sharedGroup = await prisma.groupMembership.findFirst({
      where: {
        userId: session.user.id,
        group: {
          memberships: {
            some: { userId: review.userId },
          },
        },
      },
    })

    if (!sharedGroup) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json(review)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { allowed, retryAfter } = checkRateLimit(session.user.id, 'write')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  const { id } = await params
  const existing = await prisma.review.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateReviewDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { body: reviewBody, metadata, ...rest } = parsed.data
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...rest,
      ...(reviewBody !== undefined && { body: reviewBody as object }),
      ...(metadata !== undefined && { metadata: metadata as object }),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  return NextResponse.json(review)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { allowed, retryAfter } = checkRateLimit(session.user.id, 'write')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  const { id } = await params
  const existing = await prisma.review.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
