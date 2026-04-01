import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

// ─── POST — upsert a CatalogItem from an external provider ───────────────────

interface AddProviderItemBody {
  contentType: string
  title: string
  year?: number
  coverImageUrl?: string
  externalId: string
  provider: string
  metadata?: Record<string, unknown>
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

  const body = (await req.json()) as AddProviderItemBody

  if (!body.contentType || !body.title || !body.externalId || !body.provider) {
    return NextResponse.json(
      { error: 'Missing required fields: contentType, title, externalId, provider' },
      { status: 400 }
    )
  }

  const item = await prisma.catalogItem.upsert({
    where: { externalId_provider: { externalId: body.externalId, provider: body.provider } },
    create: {
      contentType: body.contentType,
      title: body.title,
      year: body.year,
      coverImageUrl: body.coverImageUrl,
      externalId: body.externalId,
      provider: body.provider,
      metadata: (body.metadata ?? {}) as Prisma.InputJsonValue,
    },
    update: {},
    select: { id: true, contentType: true, title: true, coverImageUrl: true, year: true },
  })

  return NextResponse.json(item, { status: 201 })
}

// ─── GET — list catalog items by type ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  const where = type ? { contentType: type } : {}

  const items = await prisma.catalogItem.findMany({
    where,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      contentType: true,
      title: true,
      coverImageUrl: true,
      backdropImageUrl: true,
      year: true,
      metadata: true,
    },
  })

  return NextResponse.json(items)
}
