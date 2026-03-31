import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { createCommentDTOSchema } from '@/entities/comment/schema'

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const body = await req.json()
  const parsed = createCommentDTOSchema.safeParse({ ...body, authorId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verificar que el usuario es miembro del grupo (omitir para comentarios personales)
  const resolvedGroupId = parsed.data.groupId === 'personal' ? null : parsed.data.groupId
  if (resolvedGroupId) {
    const isMember = await prisma.groupMembership.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId: resolvedGroupId } },
    })
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        reviewId: parsed.data.reviewId,
        groupId: resolvedGroupId,
        authorId: session.user.id,
        body: parsed.data.body,
        parentId: parsed.data.parentId ?? null,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, image: true } },
      },
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
