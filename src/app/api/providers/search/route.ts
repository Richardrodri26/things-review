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
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') as ContentType | null

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], sources: [], errors: [] })
  }

  if (!type) {
    return NextResponse.json({ error: 'Missing required param: type' }, { status: 400 })
  }

  const result = await providerRegistry.searchAll(q, type)
  return NextResponse.json(result)
}
