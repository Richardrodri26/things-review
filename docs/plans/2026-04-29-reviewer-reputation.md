# Reviewer Reputation System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Calculate reviewer reputation scores based on reactions received on their reviews and comments, and display tiers/badges across the app.

**Architecture:** Reputation is **fully derived** — no new DB tables. Computed server-side via Prisma aggregates on `ReviewReaction` and `CommentReaction`. Cached per-user via TanStack Query with stale-while-revalidate. Tier system maps score ranges to named tiers.

**Tech Stack:** Prisma aggregates, Next.js API route, TanStack Query, React, Tailwind 4, next-intl

**Prerequisite:** F1+F2 (Reactions) must be implemented first.

---

## Scoring Formula

```
reputationScore = (reviewLikes × 3) + (commentLikes × 1) - (reviewDislikes × 2) - (commentDislikes × 0.5) + (totalReviews × 2)
```

Rationale:
- Review likes are worth more (quality content)
- Comment likes worth less but still count (community participation)
- Dislikes subtract but less aggressively (don't penalize too hard)
- Review count rewards prolific reviewers

### Tier System

| Min Score | Tier | Icon | Color |
|-----------|------|------|-------|
| 0 | Newbie | 🌱 | gray |
| 10 | Contributor | ⭐ | blue |
| 50 | Enthusiast | 🔥 | orange |
| 150 | Expert | 💎 | purple |
| 500 | Legend | 👑 | gold |

---

### Task 1: Reputation API Endpoint

**Files:**
- Create: `src/app/api/users/[id]/reputation/route.ts`

**Step 1: Create GET endpoint**

```typescript
// GET /api/users/[id]/reputation
// Returns: { score: number, tier: string, breakdown: { reviewLikes, reviewDislikes, commentLikes, commentDislikes, totalReviews } }
```

Use Prisma aggregates:
```typescript
const [reviewReactions, commentReactions, reviewCount] = await Promise.all([
  prisma.reviewReaction.groupBy({
    by: ['type'],
    where: { review: { userId: params.id } },
    _count: true,
  }),
  prisma.commentReaction.groupBy({
    by: ['type'],
    where: { comment: { authorId: params.id } },
    _count: true,
  }),
  prisma.review.count({ where: { userId: params.id } }),
])
```

**Step 2: Commit**

```bash
git add src/app/api/users/[id]/reputation/
git commit -m "feat(api): add user reputation endpoint with score calculation"
```

---

### Task 2: Types + Utility

**Files:**
- Create: `src/entities/reputation/types.ts`
- Create: `src/entities/reputation/utils.ts`

**Step 1: Create types**

```typescript
export type ReputationTier = 'newbie' | 'contributor' | 'enthusiast' | 'expert' | 'legend'

export interface ReputationData {
  score: number
  tier: ReputationTier
  breakdown: {
    reviewLikes: number
    reviewDislikes: number
    commentLikes: number
    commentDislikes: number
    totalReviews: number
  }
}
```

**Step 2: Create tier calculation utility**

```typescript
export const TIER_THRESHOLDS: { min: number; tier: ReputationTier; icon: string }[] = [
  { min: 500, tier: 'legend', icon: '👑' },
  { min: 150, tier: 'expert', icon: '💎' },
  { min: 50, tier: 'enthusiast', icon: '🔥' },
  { min: 10, tier: 'contributor', icon: '⭐' },
  { min: 0, tier: 'newbie', icon: '🌱' },
]

export function getTier(score: number): { tier: ReputationTier; icon: string } {
  return TIER_THRESHOLDS.find(t => score >= t.min) ?? TIER_THRESHOLDS.at(-1)!
}
```

**Step 3: Commit**

```bash
git add src/entities/reputation/
git commit -m "feat(entities): add reputation types and tier utility"
```

---

### Task 3: TanStack Query Hook

**Files:**
- Create: `src/features/reputation/hooks/useReputation.ts`
- Create: `src/features/reputation/hooks/index.ts`
- Create: `src/features/reputation/index.ts`

**Step 1: Create hook**

```typescript
export function useReputation(userId: string) {
  return useQuery({
    queryKey: ['reputation', userId],
    queryFn: () => apiGet<ReputationData>(`/users/${userId}/reputation`),
    staleTime: 5 * 60 * 1000, // 5 minutes — reputation doesn't change rapidly
  })
}
```

**Step 2: Commit**

```bash
git add src/features/reputation/
git commit -m "feat(reputation): add TanStack Query hook"
```

---

### Task 4: ReputationBadge Atom

**Files:**
- Create: `src/shared/ui/atoms/ReputationBadge.tsx`
- Modify: `src/shared/ui/atoms/index.ts`

**Step 1: Create badge component**

Compact badge showing tier icon + tier name. Variant options: `inline` (small, next to author name), `card` (larger, for profile page with score number).

Props: `score: number`, `tier: ReputationTier`, `variant?: 'inline' | 'card'`

Colors per tier using Tailwind classes mapped from tier name.

**Step 2: Commit**

```bash
git add src/shared/ui/atoms/ReputationBadge.tsx src/shared/ui/atoms/index.ts
git commit -m "feat(ui): add ReputationBadge atom component"
```

---

### Task 5: Integrate into Profile + ReviewCard

**Files:**
- Modify: `src/features/profile/components/ProfilePage.tsx`
- Modify: `src/features/profile/components/PublicProfilePage.tsx` (from F4)
- Modify: `src/features/reviews/components/ReviewCard.tsx`

**Step 1: ProfilePage — Add reputation section**

Show full reputation card with score, tier, breakdown chart. Place it in the stats area.

**Step 2: PublicProfilePage — Add reputation badge**

Show reputation badge next to username.

**Step 3: ReviewCard — Add inline reputation badge**

Next to author name in footer, show the inline tier icon for quick recognition.

**Step 4: Commit**

```bash
git add src/features/profile/ src/features/reviews/
git commit -m "feat(reputation): integrate reputation badges into profile and review cards"
```

---

### Task 6: i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Step 1: Add reputation namespace**

```json
"reputation": {
  "title": "Reputation",
  "score": "Score",
  "tier": {
    "newbie": "Newbie",
    "contributor": "Contributor",
    "enthusiast": "Enthusiast",
    "expert": "Expert",
    "legend": "Legend"
  },
  "breakdown": {
    "reviewLikes": "Review likes",
    "reviewDislikes": "Review dislikes",
    "commentLikes": "Comment likes",
    "commentDislikes": "Comment dislikes",
    "totalReviews": "Total reviews"
  }
}
```

Spanish equivalents in `es.json`.

**Step 2: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add reputation translation keys (EN/ES)"
```
