import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id: followingId } = await params
  const followerId = session.user.id

  if (followerId === followingId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  })

  if (existing) {
    await prisma.userFollow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    })
  } else {
    await prisma.userFollow.create({ data: { followerId, followingId } })
  }

  const followerCount = await prisma.userFollow.count({ where: { followingId } })

  return NextResponse.json({ isFollowing: !existing, followerCount })
}
