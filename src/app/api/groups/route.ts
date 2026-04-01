import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { createGroupDTOSchema } from '@/entities/group/schema'
import { generateInviteCode } from '@/lib/server-utils'

async function hydrateGroup(group: {
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  visibility: string
  inviteCode: string
  ownerId: string
  focusContentTypes: string[]
  createdAt: Date
  updatedAt: Date
}) {
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })
  return { ...group, memberIds: memberships.map((m) => m.userId) }
}

export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: { group: true },
  })

  const groups = await Promise.all(memberships.map((m) => hydrateGroup(m.group)))
  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
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

  const body = await req.json()
  const parsed = createGroupDTOSchema.safeParse({ ...body, ownerId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, avatarUrl, visibility, focusContentTypes } = parsed.data

  let inviteCode = generateInviteCode()
  let tries = 0
  while (await prisma.group.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode()
    if (++tries > 10) throw new Error('Failed to generate unique invite code')
  }

  const group = await prisma.group.create({
    data: {
      name,
      description,
      avatarUrl,
      visibility,
      inviteCode,
      ownerId: session.user.id,
      focusContentTypes: focusContentTypes ?? [],
      memberships: {
        create: { userId: session.user.id, role: 'owner' },
      },
    },
  })

  return NextResponse.json({ ...group, memberIds: [session.user.id] }, { status: 201 })
}
