# Similar Content Recommendations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show "If you liked this, you might also like..." recommendations on movie and series detail pages using TMDB's similar content API.

**Architecture:** No DB changes. Extend the existing TMDB provider with `getSimilar()` method. New proxy API route. New `SimilarContentGrid` component rendered at the bottom of detail pages. TanStack Query caches results.

**Tech Stack:** TMDB API, Next.js API route, TanStack Query, React, Tailwind 4, next-intl

**Prerequisite:** None — fully independent.

---

### Task 1: Extend TMDB Provider

**Files:**
- Modify: `src/shared/services/providers/tmdb/index.ts`
- Modify: `src/shared/services/providers/tmdb/types.ts`
- Modify: `src/shared/services/providers/types.ts`

**Step 1: Add TMDB types for similar response**

The TMDB similar endpoint returns the same format as search results. Add a `getSimilar(externalId: string, contentType: ContentType): Promise<ProviderSearchResult[]>` method to the `ContentProvider` interface (optional method).

**Step 2: Implement in TMDBProvider**

```typescript
// TMDB endpoints:
// GET /movie/{movie_id}/similar
// GET /tv/{series_id}/similar
// Both return TMDBSearchResponse format

async getSimilar(externalId: string, contentType: 'movie' | 'series'): Promise<ProviderSearchResult[]> {
  const path = contentType === 'movie'
    ? `/movie/${externalId}/similar`
    : `/tv/${externalId}/similar`
  const data = await this.fetchTMDB<TMDBSearchResponse<TMDBSearchMovie | TMDBSearchSeries>>(path)
  return data.results.slice(0, 8).map(item => this.mapToSearchResult(item, contentType))
}
```

**Step 3: Commit**

```bash
git add src/shared/services/providers/
git commit -m "feat(tmdb): add getSimilar method to TMDB provider"
```

---

### Task 2: Similar Content API Route

**Files:**
- Create: `src/app/api/providers/similar/route.ts`

**Step 1: Create proxy route**

```typescript
// GET /api/providers/similar?externalId=123&contentType=movie&provider=tmdb
// Returns: ProviderSearchResult[]
```

Reuses the provider registry to find the TMDB provider and call `getSimilar()`.

**Step 2: Commit**

```bash
git add src/app/api/providers/similar/
git commit -m "feat(api): add similar content proxy endpoint"
```

---

### Task 3: Hook for Similar Content

**Files:**
- Create: `src/features/catalog/hooks/useSimilarContent.ts`
- Modify: `src/features/catalog/hooks/index.ts`

**Step 1: Create hook**

```typescript
export function useSimilarContent(externalId: string | undefined, contentType: ContentType) {
  return useQuery({
    queryKey: ['similar-content', externalId, contentType],
    queryFn: () => apiGet<ProviderSearchResult[]>('/providers/similar', { externalId, contentType, provider: 'tmdb' }),
    enabled: !!externalId,
    staleTime: 30 * 60 * 1000, // 30 min — similar content doesn't change often
  })
}
```

**Step 2: Commit**

```bash
git add src/features/catalog/hooks/
git commit -m "feat(catalog): add useSimilarContent hook"
```

---

### Task 4: SimilarContentGrid Component

**Files:**
- Create: `src/features/catalog/components/SimilarContentGrid.tsx`
- Modify: `src/features/catalog/components/index.ts`

**Step 1: Create the component**

A horizontal scrollable grid of poster cards. Each card shows:
- Cover image (poster)
- Title
- Year
- Link to the detail page (creates CatalogItem if needed, or links by externalId)

Uses the existing `CatalogItemCard` pattern or a simpler "mini" card variant.

Props: `externalId: string`, `contentType: ContentType`

**Step 2: Commit**

```bash
git add src/features/catalog/components/
git commit -m "feat(catalog): add SimilarContentGrid component"
```

---

### Task 5: Integrate into Detail Pages

**Files:**
- Modify: `src/features/catalog/components/MovieDetailPage.tsx`
- Modify: `src/features/catalog/components/SeriesDetailPage.tsx`

**Step 1: Add SimilarContentGrid to MovieDetailPage**

Below the review section, add:
```tsx
<SimilarContentGrid
  externalId={movie.externalId}
  contentType="movie"
/>
```

**Step 2: Add SimilarContentGrid to SeriesDetailPage**

Same pattern for series.

**Step 3: Commit**

```bash
git add src/features/catalog/components/
git commit -m "feat(catalog): show similar content on movie and series detail pages"
```

---

### Task 6: i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Step 1: Add similar content keys**

```json
"catalog": {
  // ... existing keys ...
  "similar": {
    "title": "You might also like",
    "empty": "No similar titles found",
    "loading": "Finding similar titles..."
  }
}
```

Spanish:
```json
"catalog": {
  "similar": {
    "title": "También te podría gustar",
    "empty": "No se encontraron títulos similares",
    "loading": "Buscando títulos similares..."
  }
}
```

**Step 2: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add similar content translation keys (EN/ES)"
```
