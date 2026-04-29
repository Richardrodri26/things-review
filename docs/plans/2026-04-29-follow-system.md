# Follow System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to follow/unfollow other reviewers, see follower/following counts, and view public profiles of other users.

**Architecture:** New `UserFollow` Prisma model with composite PK. API toggle endpoint. New public profile page at `/profile/[id]`. `FollowButton` component reused across ReviewCard author sections and profile pages. TanStack Query for follow state.

**Tech Stack:** Prisma, Next.js API routes + App Router, TanStack Query, React, Tailwind 4, next-intl, Zod

---

## DB Schema

### UserFollow
```prisma
model UserFollow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
}
```

### User model updates
```prisma
model User {
  // ... existing fields ...
  followers UserFollow[] @relation("UserFollowing")  // people who follow this user
  following UserFollow[] @relation("UserFollowers")   // people this user follows
}
```

---

### Task 1: Prisma Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add UserFollow model and User relations**

Add the `UserFollow` model. Add `followers` and `following` relations to `User`.

**Step 2: Generate and run migration**

Run: `npx prisma migrate dev --name add_user_follows`
Expected: Migration created and applied.

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat(db): add UserFollow table for follow system"
```

---

### Task 2: Types

**Files:**
- Create: `src/entities/follow/types.ts`

**Step 1: Create follow types**

```typescript
export interface FollowStatus {
  isFollowing: boolean
  followerCount: number
  followingCount: number
}

export interface UserPublicProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  followerCount: number
  followingCount: number
  reviewCount: number
  isFollowing: boolean // from current user's perspective
  createdAt: Date
}
```

**Step 2: Commit**

```bash
git add src/entities/follow/
git commit -m "feat(entities): add follow system types"
```

---

### Task 3: Follow API Endpoints

**Files:**
- Create: `src/app/api/users/[id]/follow/route.ts`
- Create: `src/app/api/users/[id]/route.ts`
- Create: `src/app/api/users/[id]/followers/route.ts`
- Create: `src/app/api/users/[id]/following/route.ts`

**Step 1: POST /api/users/[id]/follow — Toggle follow**

Logic:
1. `requireSession()` — must be logged in
2. Prevent self-follow (400)
3. Check if `UserFollow` row exists
4. If exists → delete (unfollow)
5. If not → create (follow)
6. Return `{ isFollowing: boolean, followerCount: number }`

**Step 2: GET /api/users/[id] — Public profile**

Returns user public info + counts (followers, following, reviews). Includes `isFollowing` if current user is authenticated.

**Step 3: GET /api/users/[id]/followers + /following**

Paginated list of users. Returns `{ users: UserPublicProfile[], total: number }`.

**Step 4: Commit**

```bash
git add src/app/api/users/
git commit -m "feat(api): add follow toggle, public profile, and follower/following list endpoints"
```

---

### Task 4: Service Layer + Hooks

**Files:**
- Create: `src/features/follow/hooks/useFollow.ts`
- Create: `src/features/follow/hooks/index.ts`
- Create: `src/features/follow/index.ts`

**Step 1: Create TanStack Query hooks**

```typescript
export function useUserProfile(userId: string) { ... }
export function useFollowStatus(userId: string) { ... }
export function useToggleFollow(userId: string) { ... }
export function useFollowers(userId: string) { ... }
export function useFollowing(userId: string) { ... }
```

Use optimistic updates for toggle.

**Step 2: Commit**

```bash
git add src/features/follow/
git commit -m "feat(follow): add TanStack Query hooks for follow system"
```

---

### Task 5: FollowButton Component

**Files:**
- Create: `src/shared/ui/atoms/FollowButton.tsx`
- Modify: `src/shared/ui/atoms/index.ts`

**Step 1: Create FollowButton**

A button that shows "Follow" / "Following" (with unfollow on hover showing "Unfollow"). States:
- Not following: outline style, "Follow" text
- Following: filled/primary style, "Following" text
- Hover when following: destructive hint, "Unfollow" text
- Loading: spinner
- Disabled: for own profile or unauthenticated

**Step 2: Commit**

```bash
git add src/shared/ui/atoms/FollowButton.tsx src/shared/ui/atoms/index.ts
git commit -m "feat(ui): add FollowButton atom component"
```

---

### Task 6: Public Profile Page

**Files:**
- Create: `src/app/(app)/profile/[id]/page.tsx`
- Create: `src/features/profile/components/PublicProfilePage.tsx`

**Step 1: Create public profile page**

Shows:
- User avatar, display name, username, bio
- Follower/following counts (clickable to show lists)
- Follow/unfollow button (if not own profile)
- Recent reviews by this user
- Reputation score (placeholder for F3)

**Step 2: Update nav to link author names to public profiles**

In `ReviewCard`, make the author name/avatar a link to `/profile/{userId}`.

**Step 3: Commit**

```bash
git add src/app/(app)/profile/[id]/ src/features/profile/components/PublicProfilePage.tsx
git commit -m "feat(profile): add public profile page with follow functionality"
```

---

### Task 7: Integrate Follow into Existing Components

**Files:**
- Modify: `src/features/reviews/components/ReviewCard.tsx`
- Modify: `src/features/reviews/components/ReviewDetailPage.tsx`

**Step 1: ReviewCard — Link author to public profile**

Wrap the author avatar + name in a `<Link href={/profile/${author.id}}>`.

**Step 2: ReviewDetailPage — Add author section with FollowButton**

Below the review header, add an author card showing avatar, name, and a FollowButton (if not own review).

**Step 3: Commit**

```bash
git add src/features/reviews/components/ src/features/profile/
git commit -m "feat(follow): integrate follow button into review components"
```

---

### Task 8: i18n Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Step 1: Add follow namespace keys**

```json
"follow": {
  "follow": "Follow",
  "following": "Following",
  "unfollow": "Unfollow",
  "followers": "Followers",
  "followersCount": "{count, plural, one {# follower} other {# followers}}",
  "followingCount": "{count, plural, one {# following} other {# following}}",
  "noFollowers": "No followers yet",
  "noFollowing": "Not following anyone yet",
  "cannotFollowSelf": "You can't follow yourself"
}
```

Spanish equivalents added to `es.json`.

**Step 2: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add follow system translation keys (EN/ES)"
```
