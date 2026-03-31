# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Pending items to be tracked as development continues

---

## [0.1.0] - 2026-03-31

### Added

#### Infrastructure & Setup
- Initial project scaffold with Next.js and Create Next App
- Zustand store with Immer middleware — slices for user, reviews, groups, and UI state
- TanStack Query with `QueryClientProvider` and devtools
- `next-intl` v4 internationalization with EN/ES messages
- Zod schemas for all domain entities
- Domain type definitions for all entities
- Shared constants, utilities, and route definitions
- Feature-Sliced Design folder structure with TypeScript path aliases
- `localStorage` service layer with `IUserService`, `IReviewService`, `IGroupService`
- `useLocalStorage` and `useMediaQuery` shared hooks
- Prisma ORM integrated with PostgreSQL — schema updated for all entities

#### Shell & Navigation
- `(app)` route group with sidebar shell layout
- `AppHeader` with breadcrumb support in the app shell
- Sidebar adapted with app navigation and user context from store

#### Authentication & Onboarding
- Onboarding page with user creation form
- `ONBOARDING` route constant
- Auth guard — redirects to onboarding when no user is found in store

#### Reviews
- Review query hooks with TanStack Query
- `RatingStars`, `ContentTypeBadge`, `StatusBadge`, and `EmptyState` shared atomic UI components
- `ReviewForm` with TanStack Form and Zod validation
- `ReviewCard` component
- `ReviewList` with full CRUD — create, edit, delete with confirmation dialog
- `ReviewEditorPage` and `ReviewDetailPage` components
- Content type and status filters in `ReviewList`

#### Catalog
- Catalog service with movie and series mock data
- Catalog query hooks
- `CatalogItemCard` component
- Movies catalog page
- Movie detail page with review integration
- Series catalog page
- Series detail page with review integration
- Manual catalog entry support for any content type
- `CatalogFilters` component
- Catalog components barrel export

#### Watchlist
- `WatchlistCard`, `WatchlistForm`, and `WatchlistPage` components
- `useWatchlistMutations` hook

#### Groups
- Group query hooks
- `GroupForm`, `JoinGroupForm`, and `GroupCard` components
- Groups list page with create and join dialogs
- Group detail page with invite code and reviews
- Group join and creation API endpoints
- `useGroupMutations` hook

#### Profile
- Profile query hooks
- User stats computation hook (`useUserStats`)
- `StatsCard` atom
- `ProfileForm` component
- Profile page with stats and edit form
- `useProfileMutations` hook

#### Dashboard
- `QuickStatsSection` dashboard component
- `RecentReviewsSection` dashboard component
- `CatalogHighlightsSection` dashboard component
- Dashboard page aggregating stats, recent reviews, and catalog highlights

#### Comments
- `parentId` field added to `Comment` model for threaded replies
- Comment thread building in service layer with cascaded delete for replies
- `CommentForm` updated to support `parentId` for threaded replies
- `ReplyForm` inline component
- `CommentCard` updated to show threaded replies with inline `ReplyForm`
- `CommentThread` replies wired into `CommentList`
- `useComments` hook return type aligned with `CommentThread`

#### i18n
- Language selector component
- Locale management with cookie-based persistence (`NEXT_LOCALE`)

#### Editor
- EditorJS tools configuration and TypeScript types

---

[Unreleased]: https://github.com/richard26/things-review/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/richard26/things-review/releases/tag/v0.1.0
