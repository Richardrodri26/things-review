# Reactions System Implementation Plan (Reviews + Comments)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add like/dislike reactions to reviews and comments, with per-user toggle and aggregate counts.

**Architecture:** New `ReviewReaction` and `CommentReaction` Prisma models with unique constraint per user. API routes toggle (upsert/delete). UI uses a shared `ReactionButton` atom. TanStack Query caches reaction state per entity.

**Tech Stack:** Prisma, Next.js API routes, TanStack Query, React, Tailwind 4, next-intl, Zod

---

## DB Schema

### ReviewReaction
```prisma
model ReviewReaction {
  id        String   @id @default(uuid())
  reviewId  String
  userId    String
  type      String   // 'like' | 'dislike'
  createdAt DateTime @default(now())

  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user   User   @relation("UserReviewReactions", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId])
}
```

### CommentReaction
```prisma
model CommentReaction {
  id        String   @id @default(uuid())
  commentId String
  userId    String
  type      String   // 'like' | 'dislike'
  createdAt DateTime @default(now())

  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation("UserCommentReactions", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId])
}
```

### User model updates (add relations)
```prisma
model User {
  // ... existing fields ...
  reviewReactions  ReviewReaction[]  @relation("UserReviewReactions")
  commentReactions CommentReaction[] @relation("UserCommentReactions")
}

model Review {
  // ... existing fields ...
  reactions ReviewReaction[]
}

model Comment {
  // ... existing fields ...
  reactions CommentReaction[]
}
```

---

### Task 1: Prisma Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add ReviewReaction and CommentReaction models to schema**

Add `ReviewReaction` and `CommentReaction` models (as shown above). Add `reactions` relation to `Review` and `Comment`. Add `reviewReactions` and `commentReactions` relations to `User`.

**Step 2: Generate and run migration**

Run: `npx prisma migrate dev --name add_reactions`
Expected: Migration created and applied successfully.

**Step 3: Verify generated client**

Run: `npx prisma generate`
Expected: Prisma Client generated.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(db): add ReviewReaction and CommentReaction tables"
```

---

### Task 2: Types + Schemas

**Files:**
- Create: `src/entities/reaction/types.ts`
- Create: `src/entities/reaction/schema.ts`

**Step 1: Create reaction types**

```typescript
// src/entities/reaction/types.ts
export type ReactionType = 'like' | 'dislike'

export interface Reaction {
  id: string
  userId: string
  type: ReactionType
  createdAt: Date
}

export interface ReactionSummary {
  likeCount: number
  dislikeCount: number
  userReaction: ReactionType | null // current user's reaction
}

export interface ToggleReactionDTO {
  type: ReactionType
}
```

**Step 2: Create Zod schema**

```typescript
// src/entities/reaction/schema.ts
import { z } from 'zod'

export const toggleReactionSchema = z.object({
  type: z.enum(['like', 'dislike']),
})
```

**Step 3: Commit**

```bash
git add src/entities/reaction/
git commit -m "feat(entities): add reaction types and schemas"
```

---

### Task 3: Review Reactions API

**Files:**
- Create: `src/app/api/reviews/[id]/reactions/route.ts`

**Step 1: Create the API route**

```typescript
// GET — returns ReactionSummary for the review
// POST — toggles the user's reaction (upsert if different type, delete if same type)
```

The GET handler queries `ReviewReaction` grouped by type with `_count`, plus checks for the current user's reaction.

The POST handler:
1. Parses body with `toggleReactionSchema`
2. Checks if user already has a reaction on this review
3. If same type → delete (un-react)
4. If different type → update
5. If no existing → create
6. Returns updated `ReactionSummary`

**Step 2: Commit**

```bash
git add src/app/api/reviews/[id]/reactions/
git commit -m "feat(api): add review reactions endpoint (toggle like/dislike)"
```

---

### Task 4: Comment Reactions API

**Files:**
- Create: `src/app/api/comments/[id]/reactions/route.ts`

**Step 1: Create the API route**

Same pattern as Task 3 but for `CommentReaction` table. Reference `commentId` instead of `reviewId`.

**Step 2: Commit**

```bash
git add src/app/api/comments/[id]/reactions/
git commit -m "feat(api): add comment reactions endpoint (toggle like/dislike)"
```

---

### Task 5: Service Layer + Hooks

**Files:**
- Create: `src/shared/services/api/reaction.service.ts`
- Create: `src/features/reactions/hooks/useReactions.ts`
- Create: `src/features/reactions/hooks/index.ts`
- Create: `src/features/reactions/index.ts`

**Step 1: Create API service**

```typescript
// reaction.service.ts
export class ApiReactionService {
  async getReviewReactions(reviewId: string): Promise<ReactionSummary>
  async toggleReviewReaction(reviewId: string, type: ReactionType): Promise<ReactionSummary>
  async getCommentReactions(commentId: string): Promise<ReactionSummary>
  async toggleCommentReaction(commentId: string, type: ReactionType): Promise<ReactionSummary>
}
```

**Step 2: Create TanStack Query hooks**

```typescript
// useReactions.ts
export function useReviewReactions(reviewId: string) { ... }
export function useToggleReviewReaction(reviewId: string) { ... }
export function useCommentReactions(commentId: string) { ... }
export function useToggleCommentReaction(commentId: string) { ... }
```

Use optimistic updates for instant UI feedback on toggle.

**Step 3: Commit**

```bash
git add src/shared/services/api/reaction.service.ts src/features/reactions/
git commit -m "feat(reactions): add service layer and TanStack Query hooks"
```

---

### Task 6: ReactionButton Atom

**Files:**
- Create: `src/shared/ui/atoms/ReactionButton.tsx`
- Modify: `src/shared/ui/atoms/index.ts` (add export)

**Step 1: Create ReactionButton component**

A compact button showing an icon (ThumbsUp/ThumbsDown from lucide) + count. States:
- Default: muted colors
- Active (user reacted): filled/primary color
- Hover: subtle highlight
- Disabled: for unauthenticated users

Props: `type: 'like' | 'dislike'`, `count: number`, `isActive: boolean`, `onClick: () => void`, `disabled?: boolean`

**Step 2: Commit**

```bash
git add src/shared/ui/atoms/ReactionButton.tsx src/shared/ui/atoms/index.ts
git commit -m "feat(ui): add ReactionButton atom component"
```

---

### Task 7: Integrate into ReviewCard + ReviewDetailPage

**Files:**
- Modify: `src/features/reviews/components/ReviewCard.tsx`
- Modify: `src/features/reviews/components/ReviewDetailPage.tsx`

**Step 1: Add reactions to ReviewCard footer**

In the footer meta area of `ReviewCard`, add like/dislike buttons next to the comment count. Use `useReviewReactions(review.id)` and `useToggleReviewReaction`.

**Step 2: Add reactions to ReviewDetailPage**

Below the rating stars in the header, add a reaction bar with larger like/dislike buttons.

**Step 3: Commit**

```bash
git add src/features/reviews/components/
git commit -m "feat(reviews): integrate reaction buttons into ReviewCard and ReviewDetailPage"
```

---

### Task 8: Integrate into CommentCard

**Files:**
- Modify: `src/features/comments/components/CommentCard.tsx`

**Step 1: Add reactions to CommentCard**

Next to the "Reply" button, add like/dislike buttons. Use `useCommentReactions(comment.id)` and `useToggleCommentReaction`.

**Step 2: Commit**

```bash
git add src/features/comments/components/CommentCard.tsx
git commit -m "feat(comments): integrate reaction buttons into CommentCard"
```

---

### Task 9: i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Step 1: Add reaction namespace keys to both files**

```json
"reactions": {
  "like": "Like",
  "dislike": "Dislike",
  "likeCount": "{count, plural, one {# like} other {# likes}}",
  "dislikeCount": "{count, plural, one {# dislike} other {# dislikes}}",
  "loginToReact": "Sign in to react"
}
```

Spanish equivalents:
```json
"reactions": {
  "like": "Me gusta",
  "dislike": "No me gusta",
  "likeCount": "{count, plural, one {# me gusta} other {# me gusta}}",
  "dislikeCount": "{count, plural, one {# no me gusta} other {# no me gusta}}",
  "loginToReact": "Inicia sesión para reaccionar"
}
```

**Step 2: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add reaction translation keys (EN/ES)"
```

---

### Task 10: Review API — Include reaction counts in response

**Files:**
- Modify: `src/app/api/reviews/route.ts`
- Modify: `src/app/api/reviews/[id]/route.ts`

**Step 1: Include _count of reactions in review responses**

Add `include: { _count: { select: { reactions: true } } }` or a more detailed aggregate to include `likeCount` and `dislikeCount` in the serialized review. This avoids N+1 queries from the client fetching reactions separately for each review in a list.

**Step 2: Commit**

```bash
git add src/app/api/reviews/
git commit -m "feat(api): include reaction counts in review list responses"
```
