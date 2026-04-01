import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id: groupId } = await params
  const isMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, username: true, displayName: true, image: true } },
    },
  })

  return NextResponse.json(memberships)
}

export async function DELETE(req: NextRequest, { params }: Params) {
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

  const { id: groupId } = await params
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 404 })
  if (membership.role === 'owner') {
    return NextResponse.json({ error: 'Owner cannot leave — transfer ownership first' }, { status: 400 })
  }

  await prisma.groupMembership.delete({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  return new NextResponse(null, { status: 204 })
}
