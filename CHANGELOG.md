# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `LoginForm` and `RegisterForm` auth components
- Auth layout for sign-in/sign-up pages
- Toast notifications for review mutations (create, update, delete)

### Changed

- Migrated data persistence from localStorage to Prisma + PostgreSQL
- `NavUser` component updated to read user from Zustand store
- `ReviewDetailPage` — improved action links and interaction feedback
- `AddContentForm` — refinements to catalog entry flow
- `JoinGroupForm` — UX improvements
- `useGroupMutations` hook updated

### Fixed

- `rating` field type changed to `Float` in Prisma schema (migration `20260331163054_rating_float`)

---

## [0.2.0] - 2026-04-29 — Social Engagement & Discovery

Esta versión transforma la app en una experiencia social completa. Podés interactuar con las reviews de otros usuarios, seguir reviewers, explorar contenido de la comunidad y ver cómo progresa tu reputación como crítico.

### Nuevas funciones

#### 👍 Reacciones en reviews y comentarios

Ahora podés expresar tu opinión sobre cualquier review o comentario con un 👍 o 👎, sin necesidad de escribir nada.

**Cómo probarlo:**
1. Abrí cualquier review desde `/reviews`
2. En la página de detalle, usá los botones de reacción debajo del contenido
3. El contador se actualiza al instante — sin recargar la página
4. Hacé click de nuevo en el mismo botón para deshacer tu reacción
5. Cambiá de 👍 a 👎 y la reacción anterior se reemplaza automáticamente
6. En el listado `/reviews`, cada card también muestra los botones directamente

> Necesitás estar logueado para reaccionar. Los botones están deshabilitados si no tenés sesión.

---

#### 👥 Seguir reviewers

Podés seguir a tus críticos favoritos y armar tu propia red de recomendaciones.

**Cómo probarlo:**
1. Abrí cualquier review desde `/reviews`
2. Junto al nombre del autor, hacé click en **Follow**
3. El botón cambia a **Following** al instante
4. Hover sobre **Following** para ver la opción **Unfollow**
5. Hacé click en el nombre del autor para ir a su perfil público `/profile/[id]`
6. Desde el perfil podés ver sus seguidores, a quién sigue y cuántas reviews escribió

> El botón Follow no aparece en tu propio perfil.

---

#### 🏅 Reputación de reviewer

Cada usuario tiene un score de reputación que sube con la actividad de la comunidad. El badge aparece junto a tu nombre en toda la app.

**Tiers disponibles:**
| Badge | Nivel | Condición |
|-------|-------|-----------|
| 🌱 | Newbie | Score inicial |
| ⭐ | Contributor | Actividad moderada |
| 🔥 | Enthusiast | Actividad alta |
| 💎 | Expert | Muy activo |
| 👑 | Legend | Top de la comunidad |

**Cómo probarlo:**
1. Andá a tu perfil en `/profile`
2. Buscá la sección **Reputación** — muestra tu score, tier y desglose de puntos
3. En perfiles públicos (`/profile/[id]`) el badge aparece inline junto al nombre
4. En las cards del listado `/reviews`, el badge del autor es visible debajo de su nombre

---

#### 🎬 Contenido similar

Al ver el detalle de una película o serie, ahora aparece una sección con títulos similares para que sigas descubriendo contenido.

**Cómo probarlo:**
1. Abrí cualquier película en `/movies/[id]` o serie en `/series/[id]`
2. Scrolleá hacia abajo — vas a ver una sección **"Contenido similar"**
3. Cada card muestra poster, título y año
4. Hacé click en cualquier card para ir al detalle de ese contenido
5. Si no hay similares disponibles, la sección no aparece

---

#### ⭐ Rating global de la comunidad

Las páginas de detalle de películas y series ahora muestran el rating promedio calculado a partir de todas las reviews publicadas de ese contenido.

**Cómo probarlo:**
1. Abrí `/movies/[id]` o `/series/[id]` de un contenido que ya tenga reviews
2. Buscá el badge de estrella con el promedio y el conteo de reviews
3. Si el contenido no tiene reviews, el badge no aparece

---

#### 🧭 Página Explorar

Nueva sección para descubrir reviews de toda la comunidad, sin importar a quién seguís.

**Cómo probarlo:**
1. En el sidebar, hacé click en **Explore** (ícono de brújula, entre Series y Reviews)
2. O entrá directamente a `/explore`
3. Usá los tabs para filtrar por tipo: **All / Movie / Series / Music / Game / Book**
4. Cambiá el orden con el selector: **Recent / Popular / Rating ↑ / Rating ↓**
5. Scrolleá hasta el fondo y hacé click en **Load More** para ver más reviews
6. La página es pública — funciona sin estar logueado

---

#### 📰 Feed social en el dashboard

El dashboard ahora incluye un feed con las últimas reviews de los usuarios que seguís.

**Cómo probarlo:**
1. Seguí al menos a un usuario que tenga reviews publicadas
2. Andá al dashboard (`/`)
3. La sección **Feed** muestra las reviews recientes de tus seguidos con avatar, nombre, contenido y rating
4. Si no seguís a nadie, aparece un mensaje con un link directo a `/explore`

---

### Mejoras

- El nombre del autor en el detalle de una review ahora es un link al perfil público
- Los badges de tier aparecen en todas las ReviewCards del listado
- Los botones de reacción en cards usan `stopPropagation` correcto — no navegan accidentalmente al detalle

### Correcciones

- Perfil de usuario inexistente (`/profile/id-inventado`) ya muestra "Usuario no encontrado" en lugar de pantalla en blanco
- La página `/explore` era inaccesible para usuarios sin sesión — corregido, ahora es pública
- Botones "Guardar" y "Cancelar" en comentarios ahora respetan el idioma seleccionado (EN/ES)

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
