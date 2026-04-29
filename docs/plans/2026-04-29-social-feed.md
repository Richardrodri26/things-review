# Social Feed & Global Reviews Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global review feed (explore), a followed-users feed on dashboard, and global aggregate ratings on content detail pages.

**Architecture:** No new DB tables. All data comes from querying existing `Review` and `UserFollow` tables with joins and aggregates. New `/explore` page for global reviews. Dashboard gets a "From People You Follow" section. Content detail pages show aggregate rating from all users. TanStack Query with infinite scroll for feeds.

**Tech Stack:** Prisma, Next.js API routes + App Router, TanStack Query (useInfiniteQuery), React, Tailwind 4, next-intl

**Prerequisite:** F4 (Follow System) should be implemented first for the followed-users feed. Global reviews and global ratings are independent.

---

### Task 1: Global Reviews API

**Files:**
- Create: `src/app/api/reviews/global/route.ts`

**Step 1: Create paginated global reviews endpoint**

```typescript
// GET /api/reviews/global?page=1&limit=20&contentType=movie&sort=recent
// Returns: { reviews: ReviewWithUser[], total: number, page: number, hasMore: boolean }
```

This endpoint returns reviews from ALL users (not just the current user). Each review includes the author info (user join). Supports filters:
- `contentType` — filter by movie, series, etc.
- `sort` — `recent` (default), `popular` (most reactions), `rating_high`, `rating_low`

Requires auth for now (to avoid public exposure), but doesn't filter by userId.

**Step 2: Commit**

```bash
git add src/app/api/reviews/global/
git commit -m "feat(api): add global reviews endpoint with pagination and sorting"
```

---

### Task 2: Feed API (From Followed Users)

**Files:**
- Create: `src/app/api/feed/route.ts`

**Step 1: Create feed endpoint**

```typescript
// GET /api/feed?page=1&limit=20
// Returns: { reviews: ReviewWithUser[], total: number, page: number, hasMore: boolean }
```

Logic:
1. `requireSession()` — must be logged in
2. Get list of user IDs the current user follows from `UserFollow`
3. Query reviews where `userId IN followedIds`, ordered by `createdAt DESC`
4. Include user relation for author info
5. Paginate

**Step 2: Commit**

```bash
git add src/app/api/feed/
git commit -m "feat(api): add followed-users feed endpoint"
```

---

### Task 3: Global Content Rating API

**Files:**
- Create: `src/app/api/catalog/[id]/rating/route.ts`

**Step 1: Create aggregate rating endpoint**

```typescript
// GET /api/catalog/[id]/rating
// Returns: { averageRating: number, totalReviews: number, ratingDistribution: Record<1|2|3|4|5, number> }
```

Logic:
1. Query `Review` where `catalogItemId = params.id` and `rating IS NOT NULL`
2. Aggregate: avg(rating), count, group by rating value

No auth required (public data).

**Step 2: Commit**

```bash
git add src/app/api/catalog/
git commit -m "feat(api): add global aggregate rating endpoint for catalog items"
```

---

### Task 4: Hooks for Feed + Global Reviews

**Files:**
- Create: `src/features/feed/hooks/useFeed.ts`
- Create: `src/features/feed/hooks/index.ts`
- Create: `src/features/feed/index.ts`
- Create: `src/features/catalog/hooks/useGlobalRating.ts`

**Step 1: Create useFeed hook (infinite query)**

```typescript
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => apiGet('/feed', { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
}
```

**Step 2: Create useGlobalReviews hook (infinite query)**

```typescript
export function useGlobalReviews(filters?: { contentType?: string; sort?: string }) {
  return useInfiniteQuery({
    queryKey: ['global-reviews', filters],
    queryFn: ({ pageParam = 1 }) => apiGet('/reviews/global', { page: pageParam, limit: 20, ...filters }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
}
```

**Step 3: Create useGlobalRating hook**

```typescript
export function useGlobalRating(catalogItemId: string | undefined) {
  return useQuery({
    queryKey: ['global-rating', catalogItemId],
    queryFn: () => apiGet(`/catalog/${catalogItemId}/rating`),
    enabled: !!catalogItemId,
    staleTime: 10 * 60 * 1000,
  })
}
```

**Step 4: Commit**

```bash
git add src/features/feed/ src/features/catalog/hooks/
git commit -m "feat(feed): add hooks for feed, global reviews, and global ratings"
```

---

### Task 5: GlobalRatingBadge Atom

**Files:**
- Create: `src/shared/ui/atoms/GlobalRatingBadge.tsx`
- Modify: `src/shared/ui/atoms/index.ts`

**Step 1: Create the component**

Shows aggregate rating in a compact format:
- Star icon + average rating (e.g. "⭐ 4.2")
- Small text: "from X reviews"

Props: `averageRating: number`, `totalReviews: number`, `size?: 'sm' | 'md'`

**Step 2: Commit**

```bash
git add src/shared/ui/atoms/GlobalRatingBadge.tsx src/shared/ui/atoms/index.ts
git commit -m "feat(ui): add GlobalRatingBadge atom"
```

---

### Task 6: FeedSection Component (Dashboard)

**Files:**
- Create: `src/features/feed/components/FeedSection.tsx`
- Create: `src/features/feed/components/index.ts`

**Step 1: Create FeedSection**

A section for the dashboard showing recent reviews from followed users. Shows:
- Section header: "From People You Follow"
- List of ReviewCards (compact variant) with author info
- Empty state: "Follow some reviewers to see their reviews here" with link to /explore
- "See more" link

**Step 2: Commit**

```bash
git add src/features/feed/components/
git commit -m "feat(feed): add FeedSection component for dashboard"
```

---

### Task 7: Explore Page (Global Reviews)

**Files:**
- Create: `src/app/(app)/explore/page.tsx`
- Create: `src/features/explore/components/ExplorePage.tsx`
- Create: `src/features/explore/components/index.ts`
- Create: `src/features/explore/index.ts`

**Step 1: Create ExplorePage component**

Full page showing global reviews with:
- Filter bar: content type tabs (All, Movies, Series, etc.)
- Sort dropdown: Recent, Popular, Highest Rated
- Infinite scroll list of ReviewCards with author info
- Each card links to the review detail page

**Step 2: Create the route page**

```tsx
// src/app/(app)/explore/page.tsx
export default function ExploreRoute() {
  return <ExplorePage />
}
```

**Step 3: Add "Explore" to sidebar navigation**

Add a new nav item in `src/components/nav-main.tsx` for `/explore`.

**Step 4: Commit**

```bash
git add src/app/(app)/explore/ src/features/explore/ src/components/nav-main.tsx
git commit -m "feat(explore): add global reviews explore page with filters and infinite scroll"
```

---

### Task 8: Integrate Global Rating into Detail Pages

**Files:**
- Modify: `src/features/catalog/components/MovieDetailPage.tsx`
- Modify: `src/features/catalog/components/SeriesDetailPage.tsx`

**Step 1: Add GlobalRatingBadge to MovieDetailPage**

In the header area (near genres), show the `GlobalRatingBadge` with data from `useGlobalRating(movie.catalogItemId)`.

**Step 2: Same for SeriesDetailPage**

**Step 3: Commit**

```bash
git add src/features/catalog/components/
git commit -m "feat(catalog): show global aggregate rating on detail pages"
```

---

### Task 9: Integrate FeedSection into Dashboard

**Files:**
- Modify: `src/features/dashboard/components/DashboardPage.tsx`

**Step 1: Add FeedSection**

Between `QuickStatsSection` and `RecentReviewsSection`, add the `FeedSection` component (only shown if user follows anyone).

**Step 2: Commit**

```bash
git add src/features/dashboard/
git commit -m "feat(dashboard): add followed-users feed section"
```

---

### Task 10: i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Step 1: Add feed and explore keys**

```json
"feed": {
  "title": "From People You Follow",
  "empty": "Follow reviewers to see their reviews here",
  "emptyAction": "Discover reviewers",
  "seeMore": "See more"
},
"explore": {
  "title": "Explore",
  "subtitle": "Discover reviews from the community",
  "filters": {
    "all": "All",
    "sortRecent": "Most Recent",
    "sortPopular": "Most Popular",
    "sortRatingHigh": "Highest Rated",
    "sortRatingLow": "Lowest Rated"
  },
  "empty": "No reviews yet. Be the first!",
  "loadMore": "Load more"
},
"catalog": {
  "globalRating": {
    "average": "Community Rating",
    "fromReviews": "{count, plural, one {from # review} other {from # reviews}}",
    "noRatings": "No ratings yet"
  }
}
```

Spanish equivalents in `es.json`.

**Step 2: Add nav key**

```json
"nav": {
  "explore": "Explore"
}
```

**Step 3: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add feed, explore, and global rating translation keys (EN/ES)"
```

---

### Task 11: Update ROUTES constant

**Files:**
- Modify: `src/shared/constants/index.ts`

**Step 1: Add EXPLORE route**

```typescript
export const ROUTES = {
  // ... existing
  EXPLORE: '/explore',
}
```

**Step 2: Commit**

```bash
git add src/shared/constants/
git commit -m "feat(routes): add /explore route constant"
```
