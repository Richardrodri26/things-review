import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { createWatchlistItemDTOSchema } from '@/entities/watchlist/schema'

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const contentType = searchParams.get('contentType')

  const items = await prisma.watchlistItem.findMany({
    where: {
      userId: session.user.id,
      ...(contentType && { contentType }),
    },
    orderBy: { addedAt: 'desc' },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = await req.json()
  const parsed = createWatchlistItemDTOSchema.safeParse({ ...body, userId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.watchlistItem.create({
    data: {
      userId: session.user.id,
      contentId: parsed.data.contentId,
      contentType: parsed.data.contentType,
      priority: parsed.data.priority,
      note: parsed.data.note,
      targetDate: parsed.data.targetDate,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
