import { NextRequest, NextResponse } from 'next/server'
import '@/shared/services/providers' // registers all providers
import { providerRegistry } from '@/shared/services/providers/registry'
import type { ContentType } from '@/shared/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const externalId = searchParams.get('externalId')
  const contentType = searchParams.get('contentType') as ContentType | null
  const providerId = searchParams.get('provider') ?? 'tmdb'

  if (!externalId || !contentType) {
    return NextResponse.json(
      { error: 'Missing required params: externalId, contentType' },
      { status: 400 }
    )
  }

  const provider = providerRegistry.getById(providerId)
  if (!provider) {
    return NextResponse.json({ error: `Provider '${providerId}' not found` }, { status: 404 })
  }

  if (!provider.getSimilar) {
    return NextResponse.json([])
  }

  const results = await provider.getSimilar(externalId, contentType)
  return NextResponse.json(results)
}
