import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import '@/shared/services/providers' // registers all providers
import { providerRegistry } from '@/shared/services/providers/registry'
import type { ContentType } from '@/shared/types'

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { allowed, retryAfter } = checkRateLimit(session.user.id, 'search')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const provider = searchParams.get('provider')
  const type = searchParams.get('type') as ContentType | null

  if (!id || !provider || !type) {
    return NextResponse.json(
      { error: 'Missing required params: id, provider, type' },
      { status: 400 }
    )
  }

  const detail = await providerRegistry.getDetail(provider, id, type)

  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}
