# Things Review

App para registrar y reseñar contenido cultural: películas, series, libros, juegos, música y podcasts. Incluye sistema de grupos, lista de espera y comentarios en reseñas.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Componentes | shadcn/ui + Base UI |
| Auth | Better Auth 1.5 |
| ORM | Prisma 7 (adapter-pg) |
| Base de datos | PostgreSQL 15 |
| Estado global | Zustand 5 |
| Fetching | TanStack Query 5 |
| Formularios | TanStack Form 1 |
| Validación | Zod 4 |
| Editor de texto | Editor.js |
| i18n | next-intl 4 (EN/ES, cookie-based) |
| URL state | nuqs 2 |

---

## Requisitos

- Node.js 20+
- Bun (package manager)
- Docker (para PostgreSQL local)

---

## Setup local

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd things-review
bun install

# 2. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 3. Levantar la base de datos
docker compose up -d

# 4. Generar el cliente Prisma y correr migraciones
bunx prisma migrate dev

# 5. Iniciar el servidor de desarrollo
bun dev
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL | Sí |
| `BETTER_AUTH_SECRET` | Secret para firmar sesiones (`openssl rand -base64 32`) | Sí |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | Sí |

Ver `.env.example` para valores de ejemplo.

---

## Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (app)/              # Rutas protegidas (requieren auth)
│   │   ├── movies/         # Catálogo de películas
│   │   ├── series/         # Catálogo de series
│   │   ├── reviews/        # Listado y detalle de reseñas
│   │   ├── watchlist/      # Lista de espera
│   │   ├── groups/         # Grupos
│   │   └── profile/        # Perfil del usuario
│   ├── (auth)/             # Rutas públicas (login, register)
│   ├── api/                # Route Handlers (API REST)
│   └── onboarding/         # Flujo de onboarding post-registro
│
├── entities/               # Tipos y schemas por dominio
│   ├── review/
│   ├── comment/
│   ├── group/
│   ├── watchlist/
│   ├── user/
│   ├── movie/
│   └── series/
│
├── features/               # Features por dominio (components + hooks)
│   ├── auth/
│   ├── catalog/
│   ├── comments/
│   ├── groups/
│   ├── reviews/
│   ├── watchlist/
│   ├── profile/
│   ├── dashboard/
│   └── onboarding/
│
├── shared/                 # Código compartido
│   ├── ui/                 # Componentes UI atómicos
│   ├── hooks/              # Hooks genéricos
│   ├── services/api/       # Clientes HTTP por recurso
│   ├── lib/                # Query client, store Zustand, toast
│   ├── schemas/            # Schemas Zod compartidos
│   └── constants/
│
├── lib/                    # Infraestructura
│   ├── auth.ts             # Configuración Better Auth (server)
│   ├── auth-client.ts      # Cliente Better Auth (browser)
│   ├── auth-server.ts      # Helpers de auth para Server Components
│   └── prisma.ts           # Singleton PrismaClient
│
├── i18n/                   # Configuración next-intl
├── proxy.ts                # Middleware de Next.js 16 (protección de rutas)
└── generated/prisma/       # Cliente Prisma generado (no editar)

prisma/
├── schema.prisma           # Esquema de la base de datos
└── migrations/             # Historial de migraciones

messages/
├── en.json                 # Traducciones en inglés
└── es.json                 # Traducciones en español
```

---

## Base de datos

El esquema incluye las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `User` | Usuarios (campos extra: username, displayName, bio) |
| `Session` | Sesiones de Better Auth |
| `Account` | Cuentas OAuth (Better Auth) |
| `Verification` | Tokens de verificación |
| `Review` | Reseñas de contenido con rating, body (Editor.js JSON) y status |
| `Comment` | Comentarios en reseñas con soporte de hilos (parentId) |
| `Group` | Grupos con código de invitación y visibilidad |
| `GroupMembership` | Membresías de usuarios en grupos (rol) |
| `WatchlistItem` | Items de lista de espera con prioridad y fecha objetivo |

---

## API

Todos los endpoints requieren sesión activa (excepto los de auth).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `*` | `/api/auth/[...all]` | Handler de Better Auth |
| `GET/POST` | `/api/reviews` | Listar / crear reseñas |
| `GET/PUT/DELETE` | `/api/reviews/[id]` | Detalle / editar / eliminar reseña |
| `GET` | `/api/reviews/by-content` | Reseñas por contentId + contentType |
| `GET/POST` | `/api/comments` | Listar / crear comentarios |
| `PUT/DELETE` | `/api/comments/[id]` | Editar / eliminar comentario |
| `GET` | `/api/comments/by-review` | Comentarios de una reseña |
| `GET/POST` | `/api/watchlist` | Listar / agregar a lista de espera |
| `PUT/DELETE` | `/api/watchlist/[id]` | Editar / eliminar item de watchlist |
| `GET/POST` | `/api/groups` | Listar / crear grupos |
| `GET/PUT/DELETE` | `/api/groups/[id]` | Detalle / editar / eliminar grupo |
| `GET` | `/api/groups/[id]/members` | Miembros de un grupo |
| `POST` | `/api/groups/join` | Unirse a un grupo por código |
| `GET` | `/api/me` | Perfil del usuario autenticado |

---

## Internacionalización

La app soporta inglés (EN) y español (ES). El idioma se almacena en la cookie `NEXT_LOCALE` — no hay prefijos de URL.

- Agregar claves en `messages/en.json` **y** `messages/es.json` siempre que se agregue texto visible.
- Usar `useTranslations('namespace')` en Client Components y `getTranslations('namespace')` en Server Components.

---

## Scripts

```bash
bun dev          # Servidor de desarrollo
bun build        # Build de producción (genera cliente Prisma + next build)
bun start        # Servidor de producción
bun lint         # Linter ESLint

bunx prisma migrate dev    # Crear y aplicar migración
bunx prisma studio         # GUI para la base de datos
bunx prisma generate       # Regenerar cliente Prisma
```
