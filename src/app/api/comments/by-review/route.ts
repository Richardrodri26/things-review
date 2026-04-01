import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// GET /api/comments/by-review?reviewId=xxx
export async function GET(req: NextRequest) {
  const { response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const reviewId = searchParams.get('reviewId')

  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })
  }

  const comments = await prisma.comment.findMany({
    where: { reviewId },
    include: {
      author: { select: { id: true, username: true, displayName: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Construir árbol de 1 nivel (raíces + replies)
  const roots = comments.filter((c) => c.parentId === null)
  const byParent = new Map<string, typeof comments>()
  for (const c of comments) {
    if (c.parentId) {
      const list = byParent.get(c.parentId) ?? []
      list.push(c)
      byParent.set(c.parentId, list)
    }
  }

  const threads = roots.map((root) => ({
    ...root,
    replies: byParent.get(root.id) ?? [],
  }))

  return NextResponse.json(threads)
}
