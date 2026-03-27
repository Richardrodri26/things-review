# Estructura de Carpetas — Things Review

> Basada en **Feature-Sliced Design** + **Atomic Design** para componentes compartidos.

---

## Estructura completa

```
things-review/
├── app/                          # Next.js App Router (SOLO orquestación)
│   ├── [locale]/                 # Rutas con locale (next-intl)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home / Landing
│   │   ├── movies/
│   │   │   ├── page.tsx          # Catálogo de películas
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle de película
│   │   ├── series/
│   │   │   ├── page.tsx          # Catálogo de series
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle de serie
│   │   ├── reviews/
│   │   │   └── page.tsx          # Mis reviews
│   │   ├── groups/
│   │   │   ├── page.tsx          # Mis grupos
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle de grupo
│   │   └── profile/
│   │       └── page.tsx          # Mi perfil
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   └── favicon.ico
│
├── features/                     # Features de la aplicación (casos de uso)
│   ├── review-create/            # Crear una review
│   │   ├── index.ts              # Public API
│   │   ├── ui/
│   │   │   ├── ReviewCreateForm.tsx
│   │   │   └── StarRatingInput.tsx
│   │   ├── model/
│   │   │   ├── useReviewCreateForm.ts
│   │   │   └── review-create.schema.ts
│   │   └── api/
│   │       └── createReview.ts
│   │
│   ├── review-list/              # Listar y filtrar reviews
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   ├── ReviewsTable.tsx
│   │   │   ├── ReviewsFilters.tsx
│   │   │   └── ReviewCard.tsx
│   │   └── model/
│   │       └── useReviewsTable.ts
│   │
│   ├── review-detail/            # Ver detalle de una review
│   │   ├── index.ts
│   │   └── ui/
│   │       └── ReviewDetail.tsx
│   │
│   ├── group-create/             # Crear un grupo
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   └── GroupCreateForm.tsx
│   │   └── model/
│   │       ├── useGroupCreateForm.ts
│   │       └── group-create.schema.ts
│   │
│   ├── group-detail/             # Ver detalle de un grupo
│   │   ├── index.ts
│   │   └── ui/
│   │       ├── GroupDetailHeader.tsx
│   │       ├── GroupMembersList.tsx
│   │       └── GroupRankingTable.tsx
│   │
│   ├── group-reviews/            # Reviews colectivas del grupo
│   │   ├── index.ts
│   │   └── ui/
│   │       ├── GroupReviewsSummary.tsx
│   │       └── GroupReviewsList.tsx
│   │
│   ├── movie-search/             # Búsqueda y filtrado de películas
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   ├── MovieSearchInput.tsx
│   │   │   ├── MovieFilters.tsx
│   │   │   └── MovieGrid.tsx
│   │   └── model/
│   │       └── useMovieSearch.ts
│   │
│   ├── series-search/            # Búsqueda y filtrado de series
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   ├── SeriesSearchInput.tsx
│   │   │   ├── SeriesFilters.tsx
│   │   │   └── SeriesGrid.tsx
│   │   └── model/
│   │       └── useSeriesSearch.ts
│   │
│   ├── rating-summary/           # Widget de puntaje grupal
│   │   ├── index.ts
│   │   └── ui/
│   │       ├── RatingSummary.tsx
│   │       └── RatingDistributionBar.tsx
│   │
│   └── user-profile/             # Perfil de usuario
│       ├── index.ts
│       ├── ui/
│       │   ├── ProfileHeader.tsx
│       │   ├── ProfileStats.tsx
│       │   └── ProfileEditForm.tsx
│       └── model/
│           └── useProfileForm.ts
│
├── entities/                     # Modelos del dominio (sin UI)
│   ├── movie/
│   │   ├── index.ts              # Public API
│   │   ├── types.ts              # interfaces Movie, MovieDetail
│   │   ├── schema.ts             # Zod schema
│   │   ├── store.ts              # Zustand slice
│   │   └── service.ts            # IMovieService interface
│   │
│   ├── series/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── store.ts
│   │   └── service.ts
│   │
│   ├── review/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── store.ts
│   │   └── service.ts
│   │
│   ├── group/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── store.ts
│   │   └── service.ts
│   │
│   └── user/
│       ├── index.ts
│       ├── types.ts
│       ├── schema.ts
│       ├── store.ts
│       └── service.ts
│
├── shared/                       # Todo lo reutilizable sin lógica de negocio
│   ├── ui/                       # Atomic Design
│   │   ├── atoms/                # Componentes mínimos indivisibles
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Badge/
│   │   │   ├── Avatar/
│   │   │   ├── StarRating/       # Display only (no interactivo)
│   │   │   ├── Skeleton/
│   │   │   └── Spinner/
│   │   │
│   │   ├── molecules/            # Combinaciones de átomos
│   │   │   ├── SearchInput/      # Input + icono de búsqueda
│   │   │   ├── FilterChip/       # Badge + click
│   │   │   ├── ContentCard/      # Poster + título + rating
│   │   │   ├── UserAvatar/       # Avatar + nombre
│   │   │   ├── RatingBadge/      # Badge con estrellas
│   │   │   └── EmptyState/       # Ilustración + mensaje vacío
│   │   │
│   │   ├── organisms/            # Secciones completas reutilizables
│   │   │   ├── AppHeader/        # Navbar de la app
│   │   │   ├── AppSidebar/       # Sidebar de navegación
│   │   │   ├── ContentGrid/      # Grid de ContentCards
│   │   │   ├── GenreFilter/      # Filtro de géneros
│   │   │   └── PageHeader/       # Header de página con título
│   │   │
│   │   └── templates/            # Layouts de páginas
│   │       ├── MainLayout/       # Layout con header + sidebar
│   │       ├── CatalogLayout/    # Layout para catálogos con filtros
│   │       └── DetailLayout/     # Layout para páginas de detalle
│   │
│   ├── lib/                      # Configuraciones de librerías
│   │   ├── query-client.ts       # TanStack Query client config
│   │   ├── store.ts              # Zustand root store
│   │   ├── i18n.ts               # next-intl config
│   │   └── services.ts           # Service container (inyección de servicios)
│   │
│   ├── services/                 # Implementaciones de servicios
│   │   ├── local/                # Implementaciones localStorage (v1)
│   │   │   ├── local-review.service.ts
│   │   │   ├── local-movie.service.ts
│   │   │   ├── local-group.service.ts
│   │   │   └── local-user.service.ts
│   │   └── api/                  # Implementaciones HTTP (v2, vacías por ahora)
│   │       └── .gitkeep
│   │
│   ├── hooks/                    # Hooks genéricos
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── usePagination.ts
│   │
│   ├── utils/                    # Funciones puras
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── format-date.ts
│   │   ├── format-rating.ts
│   │   ├── generate-id.ts        # UUID v4
│   │   └── generate-invite-code.ts
│   │
│   ├── constants/                # Constantes globales
│   │   ├── routes.ts             # ROUTES object
│   │   ├── genres.ts             # Lista de géneros TMDB
│   │   ├── storage-keys.ts       # Keys de localStorage
│   │   └── config.ts             # Config de la app (TMDB URLs, etc.)
│   │
│   └── types/                    # Tipos primitivos compartidos
│       ├── common.types.ts       # ID, Nullable, Maybe, etc.
│       └── api.types.ts          # Response wrappers genéricos
│
├── messages/                     # Traducciones i18n
│   ├── en.json
│   └── es.json
│
├── docs/                         # Documentación del proyecto
│   ├── README.md
│   ├── features.md
│   ├── architecture.md
│   ├── data-models.md
│   ├── tech-stack.md
│   ├── roadmap.md
│   ├── folder-structure.md
│   └── i18n.md
│
├── public/                       # Assets estáticos
│   └── images/
│
├── components/                   # 🤖 GENERADO por shadcn CLI — no tocar manualmente
│   └── ui/                       # npx shadcn add <componente> deposita acá
│       ├── button.tsx            # Ejemplo: shadcn add button
│       ├── dialog.tsx
│       └── ...
│
├── lib/                          # 🤖 GENERADO por shadcn CLI — no tocar manualmente
│   └── utils.ts                  # cn() helper — configurado en components.json
│
└── components.json               # ⚙️ Config de shadcn — aliases, estilo, rutas
```

---

## shadcn/ui — Reglas de convivencia

shadcn tiene sus rutas **hardcodeadas en `components.json`** y la CLI no las negocia:

```json
{
  "aliases": {
    "ui":    "@/components/ui",   // ← donde deposita los componentes
    "utils": "@/lib/utils"        // ← donde vive el helper cn()
  }
}
```

### La regla es simple

| Carpeta | Dueño | Qué va ahí |
|---|---|---|
| `components/ui/` | **shadcn CLI** | Solo lo que genera `npx shadcn add` |
| `lib/utils.ts` | **shadcn CLI** | Solo el helper `cn()` |
| `shared/ui/` | **Nosotros** | Todos nuestros componentes (Atomic Design) |
| `shared/utils/` | **Nosotros** | Nuestras funciones utilitarias |

### Cómo usar los componentes de shadcn dentro de nuestra arquitectura

Los componentes de `components/ui/` son los **bloques de construcción** de nuestra UI en `shared/ui/`. Nunca se usan directamente en features o páginas — siempre se envuelven:

```typescript
// ✅ CORRECTO: shared/ui/atoms/Button/Button.tsx
// Wrapeamos el Button de shadcn con nuestras variantes y props tipadas
import { Button as ShadcnButton } from '@/components/ui/button'

export function Button({ variant = 'default', ...props }) {
  return <ShadcnButton variant={variant} {...props} />
}

// ✅ CORRECTO: una feature usa nuestro Button, no el de shadcn directamente
import { Button } from '@shared/ui/atoms/Button'

// ❌ INCORRECTO: una feature importa shadcn directamente
import { Button } from '@/components/ui/button'
```

Esto nos desacopla de shadcn: si en el futuro cambiamos de librería, el cambio es en `shared/ui/atoms/`, no en 50 features.

---

## Reglas de la estructura

### ✅ DO

- **Importar de capas inferiores únicamente**: `features` puede importar de `entities` y `shared`, pero no al revés.
- **Cada feature tiene su `index.ts`** que expone solo lo público.
- **Componentes propios en `shared/ui/`** siguiendo Atomic Design.
- **Componentes de shadcn en `shared/ui/atoms/` o `molecules/`** — siempre wrappeados, nunca usados directo.
- **Schemas Zod en cada entity/feature** que los necesite — no un archivo global.
- **Al agregar un componente shadcn**, correr `npx shadcn add <nombre>` y crear el wrapper en `shared/ui/` correspondiente.

### ❌ DON'T

- NO importar de `@/components/ui/` desde features, entities o pages directamente.
- NO escribir componentes propios dentro de `components/ui/` — esa carpeta es de shadcn.
- NO importar de una feature dentro de otra feature directamente. Si hay lógica compartida, va a `entities/` o `shared/`.
- NO escribir lógica de negocio en `app/` (pages). Solo orquestación.
- NO crear un archivo `utils.ts` gigante. Dividir por responsabilidad.

---

## Aliases de TypeScript

Configurar en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@features/*": ["./features/*"],
      "@entities/*": ["./entities/*"],
      "@shared/*": ["./shared/*"],
      "@messages/*": ["./messages/*"]
    }
  }
}
```

Ejemplos de uso:
```typescript
import { ReviewCreateForm } from '@features/review-create'
import type { Review } from '@entities/review'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/ui/atoms/Button'
```
