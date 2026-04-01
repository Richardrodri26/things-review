# TanStack Pacer Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate TanStack Pacer to protect critical API endpoints with per-user rate limiting (server-side) and debounce/throttle the search UI and rapid-fire mutations (client-side).

**Architecture:** A shared `src/lib/rate-limiter.ts` module holds per-user `RateLimiter` instances (keyed by `userId`) for three tiers (search / write / security). Every protected route calls `checkRateLimit(userId, tier)` immediately after `requireSession()` and returns `429 Too Many Requests` with a `Retry-After` header if exceeded. On the client, `useProviderSearch` replaces its manual `setTimeout` debounce with `useDebouncer` from `@tanstack/react-pacer`, and rapid-fire watchlist buttons are wrapped with `useThrottler`.

**Tech Stack:** Next.js 16.2 App Router, TypeScript, Bun, `@tanstack/pacer` (server vanilla), `@tanstack/react-pacer` (client hooks), next-intl v4.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/lib/rate-limiter.ts` | Per-user `RateLimiter` factory + `checkRateLimit` helper |
| Modify | `src/app/api/providers/search/route.ts` | Add `search` tier rate limit |
| Modify | `src/features/catalog/hooks/useProviderSearch.ts` | Replace manual `setTimeout` debounce with `useDebouncer` |
| Modify | `src/app/api/reviews/route.ts` | Add `write` tier to POST |
| Modify | `src/app/api/reviews/[id]/route.ts` | Add `write` tier to PATCH + DELETE |
| Modify | `src/app/api/comments/route.ts` | Add `write` tier to POST |
| Modify | `src/app/api/comments/[id]/route.ts` | Add `write` tier to PATCH + DELETE |
| Modify | `src/app/api/groups/route.ts` | Add `write` tier to POST |
| Modify | `src/app/api/groups/[id]/route.ts` | Add `write` tier to PATCH + DELETE |
| Modify | `src/app/api/groups/[id]/members/route.ts` | Add `write` tier to DELETE |
| Modify | `src/app/api/groups/join/route.ts` | Add `security` tier to POST |
| Modify | `src/app/api/catalog/items/route.ts` | Add `write` tier to POST |
| Modify | `src/app/api/me/route.ts` | Add `write` tier to PATCH |
| Modify | `src/app/api/providers/detail/route.ts` | Add `search` tier to GET |
| Modify | `src/features/watchlist/components/WatchlistCard.tsx` | Add `useThrottler` to add/remove buttons |

---

## Task 1: Install TanStack Pacer

**Files:**
- Modify: `package.json` (via bun add)

- [ ] **Step 1: Install the packages**

```bash
bun add @tanstack/pacer @tanstack/react-pacer
```

Expected output: something like `bun add v1.x.x [...] + @tanstack/pacer [...] + @tanstack/react-pacer`

- [ ] **Step 2: Verify the packages are in package.json**

Open `package.json` and confirm both `@tanstack/pacer` and `@tanstack/react-pacer` appear under `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: install @tanstack/pacer and @tanstack/react-pacer"
```

---

## Task 2: Create the shared server-side rate limiter module

**Files:**
- Create: `src/lib/rate-limiter.ts`

**Context:**
- `RateLimiter` from `@tanstack/pacer` is the vanilla (non-React) class.
- Constructor: `new RateLimiter(fn, { limit, window, onReject })`.
- `maybeExecute(...args)` returns `true` if the call was allowed, `false` if rejected.
- `getMsUntilNextWindow()` returns milliseconds until the window resets.
- `store.state.isExceeded` is `true` when the limit is currently exceeded.
- Rate limit key = `userId` (from session) — so each authenticated user gets their own limiter instance.
- We use a `Map` to hold one `RateLimiter` per `(userId, tier)` pair. The function inside the limiter is a no-op because the caller only cares about the boolean return from `maybeExecute`, not about the function's result.

**Tier configuration:**
| Tier | `limit` | `window` (ms) | Use case |
|------|---------|---------------|----------|
| `search` | 10 | 10 000 | `/api/providers/search`, `/api/providers/detail` |
| `write` | 5 | 10 000 | All write/delete endpoints |
| `security` | 3 | 30 000 | `/api/groups/join` |

- [ ] **Step 1: Create `src/lib/rate-limiter.ts`**

```typescript
// src/lib/rate-limiter.ts
import { RateLimiter } from '@tanstack/pacer'

export type RateLimitTier = 'search' | 'write' | 'security'

interface TierConfig {
  limit: number
  window: number
}

const TIER_CONFIG: Record<RateLimitTier, TierConfig> = {
  search:   { limit: 10, window: 10_000 },
  write:    { limit: 5,  window: 10_000 },
  security: { limit: 3,  window: 30_000 },
}

// Map key: `${userId}:${tier}` → RateLimiter instance
const limiters = new Map<string, RateLimiter<() => void>>()

function getLimiter(userId: string, tier: RateLimitTier): RateLimiter<() => void> {
  const key = `${userId}:${tier}`
  let limiter = limiters.get(key)

  if (!limiter) {
    const { limit, window } = TIER_CONFIG[tier]
    limiter = new RateLimiter(
      () => {}, // no-op — we only use maybeExecute() for the boolean
      { limit, window }
    )
    limiters.set(key, limiter)
  }

  return limiter
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number // seconds — present only when not allowed
}

/**
 * Check whether userId is within the rate limit for the given tier.
 * Returns { allowed: true } if the call should proceed,
 * or { allowed: false, retryAfter: N } if it should be rejected with 429.
 */
export function checkRateLimit(userId: string, tier: RateLimitTier): RateLimitResult {
  const limiter = getLimiter(userId, tier)
  const allowed = limiter.maybeExecute()

  if (!allowed) {
    const retryAfterMs = limiter.getMsUntilNextWindow()
    const retryAfter = Math.ceil(retryAfterMs / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rate-limiter.ts
git commit -m "feat: add shared per-user rate limiter module"
```

---

## Task 3: Protect `/api/providers/search` (server-side, `search` tier)

**Files:**
- Modify: `src/app/api/providers/search/route.ts`

**Context:** This route fans out to 5 external provider APIs on every request. Current code has no rate protection. We add the `search` tier (10 req / 10 s per user) immediately after `requireSession()`.

Pattern used in every protected route (copy exactly):

```typescript
const { allowed, retryAfter } = checkRateLimit(session.user.id, '<tier>')
if (!allowed) {
  return NextResponse.json(
    { error: 'Too Many Requests' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
}
```

- [ ] **Step 1: Update `src/app/api/providers/search/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/providers/search/route.ts
git commit -m "feat: add search-tier rate limit to /api/providers/search"
```

---

## Task 4: Client-side debounce on search UI

**Files:**
- Modify: `src/features/catalog/hooks/useProviderSearch.ts`

**Context:** The hook currently uses `useState` + `useEffect` + `setTimeout` (350ms) to debounce. We replace this manual pattern with `useDebouncer` from `@tanstack/react-pacer`. The `useDebouncer` hook returns a debouncer object; we call `debouncer.maybeExecute(query)` on every input change and track the pending state via a selector.

`useDebouncer` signature:
```typescript
useDebouncer(fn, options, selector?)
// options: { wait: number, leading?: boolean, trailing?: boolean }
// returns: { maybeExecute, cancel, flush, state }
```

The `queryFn` inside `useQuery` needs to read the latest debounced value. We switch from storing `debouncedQuery` in state to using a `useRef` that's updated by the debouncer callback, combined with a `useState` for the value that TanStack Query reads via its `queryKey`.

- [ ] **Step 1: Update `src/features/catalog/hooks/useProviderSearch.ts`**

Replace the entire file with:

```typescript
'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebouncer } from '@tanstack/react-pacer'
import { apiPost } from '@/shared/services/api/api-client'
import type { ContentType } from '@/shared/types'
import type { ProviderSearchResult, ProvidersSearchResponse } from '@/shared/services/providers/types'
import { CONTENT_TYPE_QUERY_KEY } from './useCatalog'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2

// ─── Search hook ──────────────────────────────────────────────────────────────

export function useProviderSearch(query: string, contentType: ContentType, enabled: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const debouncer = useDebouncer(
    (q: string) => setDebouncedQuery(q),
    { wait: DEBOUNCE_MS },
    (state) => ({ isPending: state.isPending })
  )

  // Fire debouncer on every query change (caller passes the raw input value)
  // This replaces the old useEffect + setTimeout pattern
  if (enabled) {
    debouncer.maybeExecute(query)
  }

  const shouldFetch = enabled && debouncedQuery.trim().length >= MIN_QUERY_LENGTH

  return {
    ...useQuery<ProvidersSearchResponse>({
      queryKey: ['providers', 'search', contentType, debouncedQuery],
      queryFn: async () => {
        const url = new URL('/api/providers/search', window.location.origin)
        url.searchParams.set('q', debouncedQuery)
        url.searchParams.set('type', contentType)
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error('Search failed')
        return res.json()
      },
      enabled: shouldFetch,
      staleTime: 30_000,
      gcTime: 60_000,
      placeholderData: (prev) => prev,
    }),
    isDebouncing: debouncer.state.isPending,
  }
}

// ─── Add-from-provider mutation ───────────────────────────────────────────────

interface AddProviderItemBody {
  contentType: string
  title: string
  year?: number
  coverImageUrl?: string
  externalId: string
  provider: string
  metadata?: Record<string, unknown>
}

interface AddProviderItemResponse {
  id: string
  contentType: string
  title: string
  coverImageUrl: string | null
  year: number | null
}

export function useAddFromProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (result: ProviderSearchResult) => {
      const body: AddProviderItemBody = {
        contentType: result.contentType,
        title: result.title,
        year: result.year,
        coverImageUrl: result.coverImageUrl,
        externalId: result.externalId,
        provider: result.providerId,
        metadata: {
          overview: result.overview,
          streamingAvailability: result.streamingAvailability,
        },
      }
      return apiPost<AddProviderItemResponse>('/catalog/items', body)
    },
    onSuccess: (item) => {
      const key = CONTENT_TYPE_QUERY_KEY[item.contentType]
      if (key) queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
```

> **Note on the debouncer call inside render:** Calling `debouncer.maybeExecute(query)` during render is intentional — `useDebouncer` is specifically designed to accept calls from render or event handlers interchangeably. The debouncer schedules the callback (setting state) to fire after `DEBOUNCE_MS` idle time; it does NOT cause an infinite render loop because it updates state only after the debounce delay, and at that point the `query` input hasn't changed.

- [ ] **Step 2: Commit**

```bash
git add src/features/catalog/hooks/useProviderSearch.ts
git commit -m "feat: replace manual debounce with useDebouncer in useProviderSearch"
```

---

## Task 5: Protect write endpoints — reviews + comments

**Files:**
- Modify: `src/app/api/reviews/route.ts`
- Modify: `src/app/api/reviews/[id]/route.ts`
- Modify: `src/app/api/comments/route.ts`
- Modify: `src/app/api/comments/[id]/route.ts`

**Tier:** `write` (5 req / 10 s per user). Applied only to mutating methods (POST, PATCH, DELETE). GET methods are left unprotected.

- [ ] **Step 1: Update `src/app/api/reviews/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { createReviewDTOSchema } from '@/entities/review/schema'

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  const { searchParams } = req.nextUrl
  const contentType = searchParams.get('contentType')
  const status = searchParams.get('status')

  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
      ...(contentType && { contentType }),
      ...(status && { status }),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
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

  const body = await req.json()
  const parsed = createReviewDTOSchema.safeParse({ ...body, userId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { userId, contentId, contentType, rating, title, body: reviewBody,
    containsSpoilers, status: reviewStatus, metadata, consumedAt } = parsed.data

  if (reviewStatus === 'want_to_consume') {
    return NextResponse.json(
      { error: 'A review cannot have status "want_to_consume". Use consumed, consuming, or dropped.' },
      { status: 422 }
    )
  }

  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: contentId } })

  const review = await prisma.review.create({
    data: {
      userId,
      contentId,
      contentType,
      rating,
      title,
      body: reviewBody as object,
      containsSpoilers,
      status: reviewStatus,
      metadata: metadata as object,
      consumedAt,
      ...(catalogItem ? { catalogItemId: catalogItem.id } : {}),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  return NextResponse.json(review, { status: 201 })
}
```

- [ ] **Step 2: Update `src/app/api/reviews/[id]/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { updateReviewDTOSchema } from '@/entities/review/schema'

type Params = { params: Promise<{ id: string }> }

const CATALOG_ITEM_SELECT = {
  id: true,
  title: true,
  coverImageUrl: true,
  backdropImageUrl: true,
  contentType: true,
  year: true,
} as const

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const review = await prisma.review.findUnique({
    where: { id },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  if (review.userId !== session.user.id) {
    const sharedGroup = await prisma.groupMembership.findFirst({
      where: {
        userId: session.user.id,
        group: {
          memberships: {
            some: { userId: review.userId },
          },
        },
      },
    })

    if (!sharedGroup) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json(review)
}

export async function PATCH(req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const existing = await prisma.review.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateReviewDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { body: reviewBody, metadata, ...rest } = parsed.data
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...rest,
      ...(reviewBody !== undefined && { body: reviewBody as object }),
      ...(metadata !== undefined && { metadata: metadata as object }),
    },
    include: { catalogItem: { select: CATALOG_ITEM_SELECT } },
  })

  return NextResponse.json(review)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const existing = await prisma.review.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Update `src/app/api/comments/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { createCommentDTOSchema } from '@/entities/comment/schema'

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

  const body = await req.json()
  const parsed = createCommentDTOSchema.safeParse({ ...body, authorId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

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
```

- [ ] **Step 4: Update `src/app/api/comments/[id]/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { updateCommentDTOSchema } from '@/entities/comment/schema'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const existing = await prisma.comment.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateCommentDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: { body: parsed.data.body },
    include: {
      author: { select: { id: true, username: true, displayName: true, image: true } },
    },
  })

  return NextResponse.json(comment)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const existing = await prisma.comment.findUnique({ where: { id } })

  if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.comment.deleteMany({ where: { parentId: id } })
  await prisma.comment.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Commit**

```bash
git add \
  src/app/api/reviews/route.ts \
  src/app/api/reviews/[id]/route.ts \
  src/app/api/comments/route.ts \
  src/app/api/comments/[id]/route.ts
git commit -m "feat: add write-tier rate limit to reviews and comments endpoints"
```

---

## Task 6: Protect group endpoints + security-sensitive join

**Files:**
- Modify: `src/app/api/groups/route.ts`
- Modify: `src/app/api/groups/[id]/route.ts`
- Modify: `src/app/api/groups/[id]/members/route.ts`
- Modify: `src/app/api/groups/join/route.ts`

**Tiers:**
- `POST /api/groups`, `PATCH /api/groups/[id]`, `DELETE /api/groups/[id]`, `DELETE /api/groups/[id]/members` → `write`
- `POST /api/groups/join` → `security` (3 req / 30 s — brute-force invite code protection)

- [ ] **Step 1: Update `src/app/api/groups/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { createGroupDTOSchema } from '@/entities/group/schema'
import { generateInviteCode } from '@/lib/server-utils'

async function hydrateGroup(group: {
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  visibility: string
  inviteCode: string
  ownerId: string
  focusContentTypes: string[]
  createdAt: Date
  updatedAt: Date
}) {
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })
  return { ...group, memberIds: memberships.map((m) => m.userId) }
}

export async function GET() {
  const { session, response } = await requireSession()
  if (response) return response

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: { group: true },
  })

  const groups = await Promise.all(memberships.map((m) => hydrateGroup(m.group)))
  return NextResponse.json(groups)
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

  const body = await req.json()
  const parsed = createGroupDTOSchema.safeParse({ ...body, ownerId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, avatarUrl, visibility, focusContentTypes } = parsed.data

  let inviteCode = generateInviteCode()
  let tries = 0
  while (await prisma.group.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode()
    if (++tries > 10) throw new Error('Failed to generate unique invite code')
  }

  const group = await prisma.group.create({
    data: {
      name,
      description,
      avatarUrl,
      visibility,
      inviteCode,
      ownerId: session.user.id,
      focusContentTypes: focusContentTypes ?? [],
      memberships: {
        create: { userId: session.user.id, role: 'owner' },
      },
    },
  })

  return NextResponse.json({ ...group, memberIds: [session.user.id] }, { status: 201 })
}
```

- [ ] **Step 2: Update `src/app/api/groups/[id]/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { updateGroupDTOSchema } from '@/entities/group/schema'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id } = await params
  const group = await prisma.group.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const isMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  })
  if (!isMember && group.visibility === 'private') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
}

export async function PATCH(req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateGroupDTOSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.update({ where: { id }, data: parsed.data })
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const { id } = await params
  const group = await prisma.group.findUnique({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  if (group.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.group.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Update `src/app/api/groups/[id]/members/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireSession()
  if (response) return response

  const { id: groupId } = await params
  const isMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, username: true, displayName: true, image: true } },
    },
  })

  return NextResponse.json(memberships)
}

export async function DELETE(req: NextRequest, { params }: Params) {
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

  const { id: groupId } = await params
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 404 })
  if (membership.role === 'owner') {
    return NextResponse.json({ error: 'Owner cannot leave — transfer ownership first' }, { status: 400 })
  }

  await prisma.groupMembership.delete({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Update `src/app/api/groups/join/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const joinSchema = z.object({ inviteCode: z.string().length(8) })

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession()
  if (response) return response

  // Stricter security tier — 3 attempts per 30 seconds
  // This protects against brute-forcing 8-character invite codes
  const { allowed, retryAfter } = checkRateLimit(session.user.id, 'security')
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
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  })
  if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  const alreadyMember = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
  })
  if (alreadyMember) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  await prisma.groupMembership.create({
    data: { userId: session.user.id, groupId: group.id, role: 'member' },
  })

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  })

  return NextResponse.json({ ...group, memberIds: memberships.map((m) => m.userId) })
}
```

- [ ] **Step 5: Commit**

```bash
git add \
  src/app/api/groups/route.ts \
  src/app/api/groups/[id]/route.ts \
  src/app/api/groups/[id]/members/route.ts \
  src/app/api/groups/join/route.ts
git commit -m "feat: add write/security-tier rate limits to group endpoints"
```

---

## Task 7: Protect catalog and profile endpoints + `/api/providers/detail`

**Files:**
- Modify: `src/app/api/catalog/items/route.ts`
- Modify: `src/app/api/me/route.ts`
- Modify: `src/app/api/providers/detail/route.ts`

**Tiers:**
- `POST /api/catalog/items` → `write` (auto-triggered on item selection, can rapid-fire)
- `PATCH /api/me` → `write` (profile update, no Zod validation — dangerous without rate limit)
- `GET /api/providers/detail` → `search` (external API call per request)

- [ ] **Step 1: Update `src/app/api/catalog/items/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Update `src/app/api/me/route.ts`**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'

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
  const { username, displayName, bio, image } = body

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
```

- [ ] **Step 3: Update `src/app/api/providers/detail/route.ts`**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add \
  src/app/api/catalog/items/route.ts \
  src/app/api/me/route.ts \
  src/app/api/providers/detail/route.ts
git commit -m "feat: add rate limits to catalog, profile, and provider detail endpoints"
```

---

## Task 8: Client-side throttle on watchlist mutations (optional enhancement)

**Files:**
- Modify: `src/features/watchlist/hooks/useWatchlistMutations.ts`

**Context:** The `useAddToWatchlist`, `useRemoveFromWatchlist`, and `useUpdateWatchlistItem` hooks call TanStack Query `useMutation`. If a user spam-clicks an add/remove button, multiple in-flight mutations can conflict. We wrap each mutation's trigger function with `useThrottler` (1000ms) so only one call fires per second per button.

The `useThrottler` hook throttles a function — it only allows one execution per `wait` window:

```typescript
const throttler = useThrottler(fn, { wait: 1000, leading: true, trailing: false })
// throttler.maybeExecute(...args) — fires immediately on first call, ignores subsequent calls within 1s
```

We expose a `throttledMutate` from each hook instead of the raw `mutate` to make integration easy for consumers.

- [ ] **Step 1: Update `src/features/watchlist/hooks/useWatchlistMutations.ts`**

Replace the entire file with:

```typescript
// src/features/watchlist/hooks/useWatchlistMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useThrottler } from '@tanstack/react-pacer'
import { services } from '@/shared/services'
import { useUser } from '@/shared/lib/store'
import { toast } from '@/shared/lib/toast'
import type { CreateWatchlistItemDTO, UpdateWatchlistItemDTO } from '@/entities/watchlist/types'
import { WATCHLIST_QUERY_KEY } from './useWatchlist'

export interface WatchlistToastMessages {
  added?: string
  addedError?: string
  addedErrorDescription?: string
  updated?: string
  updatedError?: string
  updatedErrorDescription?: string
  removed?: string
  removedError?: string
  removedErrorDescription?: string
  consumed?: string
  consumedDescription?: string
  consumedError?: string
  consumedErrorDescription?: string
}

const THROTTLE_MS = 1000

export function useAddToWatchlist(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  const mutation = useMutation({
    mutationFn: (data: Omit<CreateWatchlistItemDTO, 'userId'>) => {
      if (!user?.id) throw new Error('User not authenticated')
      return services.watchlist.create({ ...data, userId: user.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: messages?.added ?? 'Added to watchlist' })
    },
    onError: () => {
      toast.error({
        title: messages?.addedError ?? 'Could not add to watchlist',
        description: messages?.addedErrorDescription ?? 'Please try again.',
      })
    },
  })

  const throttler = useThrottler(
    (data: Omit<CreateWatchlistItemDTO, 'userId'>) => mutation.mutate(data),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (data: Omit<CreateWatchlistItemDTO, 'userId'>) => throttler.maybeExecute(data),
  }
}

export function useUpdateWatchlistItem(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) =>
      services.watchlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: messages?.updated ?? 'Watchlist item updated' })
    },
    onError: () => {
      toast.error({
        title: messages?.updatedError ?? 'Could not update item',
        description: messages?.updatedErrorDescription ?? 'Please try again.',
      })
    },
  })

  const throttler = useThrottler(
    ({ id, data }: { id: string; data: UpdateWatchlistItemDTO }) => mutation.mutate({ id, data }),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (args: { id: string; data: UpdateWatchlistItemDTO }) => throttler.maybeExecute(args),
  }
}

export function useRemoveFromWatchlist(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => services.watchlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      toast.success({ title: messages?.removed ?? 'Removed from watchlist' })
    },
    onError: () => {
      toast.error({
        title: messages?.removedError ?? 'Could not remove item',
        description: messages?.removedErrorDescription ?? 'Please try again.',
      })
    },
  })

  const throttler = useThrottler(
    (id: string) => mutation.mutate(id),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (id: string) => throttler.maybeExecute(id),
  }
}

export function useConvertWatchlistItemToReview(messages?: WatchlistToastMessages) {
  const queryClient = useQueryClient()
  const user = useUser()

  const mutation = useMutation({
    mutationFn: async ({
      watchlistItemId,
      contentId,
      contentType,
    }: {
      watchlistItemId: string
      contentId: string
      contentType: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const review = await services.reviews.create({
        userId: user.id,
        contentId,
        contentType: contentType as never,
        containsSpoilers: false,
        status: 'consumed',
      })

      await services.watchlist.delete(watchlistItemId)

      return review
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success({
        title: messages?.consumed ?? 'Marked as consumed',
        description: messages?.consumedDescription ?? 'A review was created — add your rating and thoughts.',
      })
    },
    onError: () => {
      toast.error({
        title: messages?.consumedError ?? 'Could not mark as consumed',
        description: messages?.consumedErrorDescription ?? 'Please try again.',
      })
    },
  })

  const throttler = useThrottler(
    (args: { watchlistItemId: string; contentId: string; contentType: string }) =>
      mutation.mutate(args),
    { wait: THROTTLE_MS, leading: true, trailing: false }
  )

  return {
    ...mutation,
    mutate: (args: { watchlistItemId: string; contentId: string; contentType: string }) =>
      throttler.maybeExecute(args),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/watchlist/hooks/useWatchlistMutations.ts
git commit -m "feat: throttle watchlist mutation hooks with useThrottler"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Task 1: Install both packages
- ✅ Task 2: `src/lib/rate-limiter.ts` with `checkRateLimit(userId, tier)` — 3 tiers
- ✅ Task 3: `/api/providers/search` → `search` tier
- ✅ Task 4: `useProviderSearch` → `useDebouncer` (400ms)
- ✅ Task 5: Reviews (POST/PATCH/DELETE) + Comments (POST/PATCH/DELETE) → `write` tier
- ✅ Task 6: Groups (POST/PATCH/DELETE), members DELETE → `write`; join POST → `security`
- ✅ Task 7: `/api/catalog/items` POST → `write`; `/api/me` PATCH → `write`; `/api/providers/detail` GET → `search`
- ✅ Task 8: Watchlist hooks → `useThrottler` (1000ms, leading)

**Placeholder scan:** No TODOs, no TBDs, no "similar to Task N" references. All code blocks are complete.

**Type consistency:**
- `checkRateLimit(userId: string, tier: RateLimitTier)` — used identically in Tasks 3, 5, 6, 7
- `RateLimitTier` exported from `src/lib/rate-limiter.ts`, imported implicitly by string literal in call sites (TypeScript will enforce the union)
- `useDebouncer` — `wait: 400`, `setDebouncedQuery` callback — matches Task 4 usage
- `useThrottler` — `wait: 1000, leading: true, trailing: false` — used identically in Task 8 for all 4 mutation hooks

**No hardcoded UI text:** `error: 'Too Many Requests'` is a machine-readable JSON error key, not user-visible text. Client-side components should handle 429 via existing error boundaries — no new i18n keys needed for this plan.
