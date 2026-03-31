import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

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
