import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const joinSchema = z.object({ inviteCode: z.string().length(8) })

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = await req.json()
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  })
  if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  const alreadyMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
  })
  if (alreadyMember) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  await prisma.groupMembership.create({
    data: { userId: session.user.id, groupId: group.id, role: 'member' },
  })

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
}
