# Tech Stack — Things Review

> Justificación de cada tecnología elegida y cómo se usa en el proyecto.

---

## Stack completo

| Categoría | Tecnología | Versión | Estado |
|---|---|---|---|
| Framework | Next.js | 16.x | ✅ Instalado |
| UI Library | React | 19.x | ✅ Instalado |
| Lenguaje | TypeScript | 5.x | ✅ Instalado |
| Estilos | Tailwind CSS | 4.x | ✅ Instalado |
| Componentes | shadcn/ui + Base UI | Latest | ✅ Instalado |
| Estado global | Zustand | 5.x | 🔜 Por instalar |
| Mutaciones inmutables | Immer | Latest | 🔜 Por instalar |
| Async state / caché | TanStack Query | 5.x | 🔜 Por instalar |
| Tablas | TanStack Table | 8.x | 🔜 Por instalar |
| Formularios | TanStack Form | Latest | 🔜 Por instalar |
| Validación | Zod | 4.x | 🔜 Por instalar |
| Internacionalización | next-intl | Latest | 🔜 Por instalar |
| Íconos | Lucide React | 1.x | ✅ Instalado |
| Utilidades de clases | clsx + tailwind-merge | Latest | ✅ Instalado |
| **Autenticación** | **Better Auth** | **Latest** | **🔒 v2 (backend)** |
| **Observabilidad** | **Datadog** | **Latest** | **🔒 v2 (backend)** |

---

## Framework: Next.js 16 + React 19

**¿Por qué Next.js?**

Next.js nos da routing, optimización de imágenes, y la estructura de App Router que escala bien. Con React 19 tenemos Server Components para las partes estáticas y Client Components donde necesitamos interactividad.

**Uso en el proyecto:**
- App Router para todas las rutas
- Client Components para toda la UI interactiva (reviews, formularios, grupos)
- Server Components para páginas estáticas o con data fetch inicial
- `next/image` para las imágenes de pósters de TMDB (optimización automática)

**Importante:** Leer `node_modules/next/dist/docs/` antes de escribir código. Next.js 16 tiene cambios respecto a versiones anteriores.

---

## Componentes: shadcn/ui + Base UI

**¿Por qué shadcn/ui?**

No es una librería, es un **sistema de componentes que copiás a tu repo**. Eso significa:
- Control total sobre el código
- Sin actualizaciones que te rompan algo
- Personalizable sin pelear contra la librería
- Ya integrado con Tailwind 4

**¿Por qué Base UI también?**

Base UI (de MUI) provee los primitivos headless que shadcn no tiene: `DirectionProvider`, componentes de accesibilidad, etc. Ya está instalado en el proyecto (`@base-ui/react`).

**Uso en el proyecto:**
- `shared/ui/atoms/` → Botones, inputs, badges (de shadcn)
- `shared/ui/molecules/` → Cards, dialogs, dropdowns (compuestos de shadcn)
- `shared/ui/organisms/` → ReviewCard, GroupCard, StarRating (custom)

---

## Estado Global: Zustand 5 + Immer

**¿Por qué Zustand?**

Redux tiene demasiado boilerplate para este proyecto. Zustand es simple, typesafe, y funciona perfectamente con React 19. La versión 5 tiene cambios importantes respecto a v4 — **leer el skill `zustand-5` antes de escribir stores**.

**¿Por qué Immer?**

Sin Immer, las mutaciones en Zustand requieren spread operators anidados que son horrible de leer y escribir. Con Immer podés hacer:

```typescript
// Sin Immer (doloroso)
set(state => ({
  reviews: state.reviews.map(r =>
    r.id === id ? { ...r, rating: newRating } : r
  )
}))

// Con Immer (legible)
set(produce(state => {
  const review = state.reviews.find(r => r.id === id)
  if (review) review.rating = newRating
}))
```

**Uso en el proyecto:**
- Un store global dividido en slices por entidad
- `useReviewsStore`, `useGroupsStore`, `useUserStore`, etc.
- Solo estado que necesita ser global: user session, filtros activos, lista de reviews

---

## Async State: TanStack Query 5

**¿Por qué TanStack Query si es client-only?**

Porque hoy es localStorage, mañana es una API HTTP. TanStack Query nos da:
- **Caché automático** de respuestas (evita re-fetches innecesarios)
- **Loading / error states** gratis
- **Stale-while-revalidate** para UX fluida
- **Mutaciones** con optimistic updates
- **DevTools** para debugging

La `queryFn` hoy llama a `LocalReviewService.getAll()`. Mañana llama a `ApiReviewService.getAll()`. El componente NO CAMBIA.

```typescript
// Hoy
const { data: reviews } = useQuery({
  queryKey: ['reviews', userId],
  queryFn: () => services.reviews.getAll(userId)  // lee localStorage
})

// Mañana (sin cambiar el componente)
// Solo cambias services.reviews a la implementación HTTP
```

---

## Tablas: TanStack Table 8

**¿Por qué TanStack Table?**

Para las listas de reviews con filtros, ordenamiento y paginación. TanStack Table es headless, lo que significa que vos controlás el HTML. Perfecto para integrar con shadcn/ui.

**Uso en el proyecto:**
- Tabla de "Mis reviews" con columnas: Película, Rating, Estado, Fecha
- Tabla de reviews del grupo
- Ranking grupal de películas

---

## Formularios: TanStack Form + Zod

**¿Por qué TanStack Form?**

React Hook Form es la opción popular, pero TanStack Form es más moderno, tiene mejor integración con TypeScript y está alineado con el ecosistema TanStack que ya usamos.

**¿Por qué Zod para validación?**

- Schema-first: definís los tipos Y la validación en un solo lugar
- TypeScript inference automática
- Fácil de reutilizar entre frontend y backend (cuando llegue)
- Se integra nativamente con TanStack Form

**Uso en el proyecto:**
- Formulario de crear/editar review
- Formulario de crear grupo
- Formulario de perfil de usuario
- Búsqueda con filtros validados

```typescript
// El schema define el tipo Y la validación
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
  status: z.enum(['watched', 'want_to_watch', 'watching', 'dropped']),
  containsSpoilers: z.boolean(),
})

// TypeScript infiere el tipo automáticamente
type ReviewFormData = z.infer<typeof reviewSchema>
```

---

## Internacionalización: next-intl

**¿Por qué next-intl?**

Es la solución estándar para i18n en Next.js App Router. Soporta:
- Server Components y Client Components
- Rutas con locale (`/en/movies`, `/es/movies`)
- Formateo de fechas, números y monedas por locale
- Plurales y géneros gramaticales

Ver [i18n.md](./i18n.md) para la estrategia completa.

---

## Datos de contenido: TMDB API

**¿Por qué TMDB?**

The Movie Database es la API más completa y gratuita para películas y series. Tiene:
- Millones de películas y series
- Pósters y backdrops en alta calidad
- Datos en múltiples idiomas (incluido español)
- Gratuita para uso no comercial

**Límites:**
- Rate limiting: 40 requests por 10 segundos
- Mitigación: TanStack Query cachea agresivamente + localStorage de caché

**Variables de entorno necesarias:**
```
NEXT_PUBLIC_TMDB_API_KEY=tu_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

---

## Autenticación: Better Auth (v2)

> Solo se implementa cuando se agregue el backend. En v1 no hay autenticación real.

**¿Por qué Better Auth y no NextAuth?**

NextAuth (Auth.js) es la opción "default" en el ecosistema Next.js, pero tiene problemas concretos:
- Configuración verbose y con muchas trampas para TypeScript estricto
- Soporte para edge runtime limitado y con workarounds
- El modelo de sesión es rígido — difícil de extender con campos propios
- Versión 5 (Auth.js) aún inestable al momento de documentar esto

Better Auth resuelve exactamente esos puntos:
- **TypeScript-first** desde el diseño — tipos inferidos sin casteos
- **Framework-agnostic** — si en el futuro el backend deja de ser Next.js, Better Auth se lleva sin cambios
- **Extensible por plugins** — 2FA, magic links, organizaciones, etc. se agregan como plugins, no como configuración gigante
- **Control total sobre el schema** — la tabla de usuarios es tuya, Better Auth no la impone

**Providers a implementar en v2:**

| Provider | Tipo | Prioridad |
|---|---|---|
| Email + password | Credentials | Alta |
| Google OAuth | Social | Alta |
| Magic link (email) | Passwordless | Media |
| GitHub OAuth | Social | Baja |

**Cómo se integra con la arquitectura actual:**

La capa de servicios ya está preparada. En v1, `LocalUserService` simula una sesión local. En v2 se reemplaza por llamadas autenticadas con Better Auth sin tocar features ni componentes.

```typescript
// shared/lib/auth.ts (v2)
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  database: { ... },           // Postgres adapter
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  }
})

// El tipo de sesión es completamente inferido — sin casteos
type Session = typeof auth.$Infer.Session
```

**Variables de entorno necesarias en v2:**
```
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Observabilidad: Datadog (v2)

> Se configura cuando se agregue el backend. En v1 no hay servidor que monitorear.

**¿Qué vamos a monitorear con Datadog?**

Datadog cubre tres pilares de observabilidad que necesitamos desde el día 1 del backend:

| Pilar | Qué monitorea | Herramienta Datadog |
|---|---|---|
| **Logs** | Errores de API, eventos de negocio, auth failures | Log Management |
| **Métricas** | Latencia de endpoints, tasa de errores, uso de DB | APM + Metrics |
| **Trazas** | Request completo de punta a punta (frontend → API → DB) | APM + Tracing |

**Integración en Next.js (v2):**

```typescript
// instrumentation.ts (Next.js built-in)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { datadogRum } = await import('@datadog/browser-rum')

    datadogRum.init({
      applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID!,
      clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
      site: 'datadoghq.com',
      service: 'things-review',
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      sessionSampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
    })
  }
}
```

**Qué se instrumenta desde el frontend (RUM — Real User Monitoring):**
- Errores de JavaScript no capturados
- Performance de cada página (Core Web Vitals)
- Acciones del usuario que fallaron (ej: error al crear review)
- Tiempos de carga de recursos (imágenes de TMDB, chunks de JS)

**Qué se instrumenta desde el backend (APM):**
- Latencia de cada endpoint de la API
- Queries lentas a la base de datos
- Errores 4xx / 5xx con contexto completo
- Trazas distribuidas cuando un request pasa por múltiples servicios

**Preparación en v1 — lo que sí se puede hacer ahora:**

Aunque Datadog se implemente en v2, hay dos cosas que se pueden preparar desde v1 para no tener que refactorear después:

1. **Wrapper de logging propio** — en vez de usar `console.log` directamente, usar una abstracción que en v1 loguea a consola y en v2 envía a Datadog:

```typescript
// shared/lib/logger.ts
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(message, context)
    // v2: dd.logger.info(message, context)
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(message, error, context)
    // v2: dd.logger.error(message, { error, ...context })
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(message, context)
    // v2: dd.logger.warn(message, context)
  },
}
```

2. **Error boundaries con contexto** — los error boundaries de React deben capturar el contexto suficiente (userId, ruta, acción) para que cuando se integre Datadog, los errores tengan trazabilidad desde el primer día.

**Variables de entorno necesarias en v2:**
```
NEXT_PUBLIC_DATADOG_APPLICATION_ID=
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=
DATADOG_API_KEY=
DATADOG_APP_KEY=
DD_SERVICE=things-review
DD_ENV=production
```

---

## Herramientas de desarrollo

| Herramienta | Propósito |
|---|---|
| ESLint + eslint-config-next | Linting |
| TypeScript strict mode | Type safety |
| TanStack Query DevTools | Debug de caché y queries |
| Zustand DevTools | Debug de estado global |

---

## Dependencias por instalar

```bash
# Estado y async
bun add zustand immer @tanstack/react-query @tanstack/react-query-devtools

# Formularios y tablas
bun add @tanstack/react-form @tanstack/react-table

# Validación
bun add zod

# i18n
bun add next-intl
```
