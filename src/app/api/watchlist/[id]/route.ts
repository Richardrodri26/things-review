import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { updateWatchlistItemDTOSchema } from '@/entities/watchlist/schema'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const existing = await prisma.watchlistItem.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateWatchlistItemDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.watchlistItem.update({ where: { id }, data: parsed.data })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const existing = await prisma.watchlistItem.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.watchlistItem.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
