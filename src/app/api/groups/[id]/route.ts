import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { updateGroupDTOSchema } from '@/entities/group/schema'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const group = await prisma.group.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const isMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  })
  if (!isMember && group.visibility === 'private') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
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
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateGroupDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.update({ where: { id }, data: parsed.data })
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
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
  const group = await prisma.group.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  if (group.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.group.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
