import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from './auth'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }
  return { session, response: null } as const
}
