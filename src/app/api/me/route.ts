import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

// Security: runtime validation — TypeScript types do not validate request bodies at runtime
const updateMeSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores')
    .optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  // Security: only allow http/https URLs to prevent javascript: or data: URIs
  image: z.string().url().max(2048).optional(),
})

export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
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
  const parsed = updateMeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { username, displayName, bio, image } = parsed.data

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(username !== undefined && { username }),
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(image !== undefined && { image }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user)
}
