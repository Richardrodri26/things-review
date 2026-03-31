import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { updateReviewDTOSchema } from '@/entities/review/schema'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const review = await prisma.review.findUnique({ where: { id } })

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  // Owner can always see their own review
  if (review.userId !== session.user.id) {
    // Allow if the viewer shares at least one group with the review's author
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
  })

  return NextResponse.json(review)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const existing = await prisma.review.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
