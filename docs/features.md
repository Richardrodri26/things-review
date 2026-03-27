# Features & Alcance — Things Review

## Visión del producto

**Things Review** permite a los usuarios registrar sus reviews personales de contenido audiovisual y compartirlas dentro de grupos privados o públicos. El objetivo es crear una experiencia social alrededor de las opiniones: comparar gustos, descubrir qué piensan tus amigos sobre una película y ver el puntaje colectivo del grupo.

---

## Scope v1 — MVP (Client-only)

### 🎬 Catálogo de contenido

| Feature | Descripción |
|---|---|
| Búsqueda de películas | Buscar películas por título (integración con TMDB API en v1 o lista local) |
| Búsqueda de series | Buscar series por título |
| Detalle de película/serie | Ver información básica: título, año, géneros, sinopsis, póster |
| Filtrado por género | Filtrar el catálogo por género |
| Filtrado por año | Filtrar por año de lanzamiento |

### ⭐ Sistema de Reviews

| Feature | Descripción |
|---|---|
| Crear review | El usuario puede escribir su review de una película o serie |
| Puntaje 1-5 estrellas | Rating obligatorio en escala 1-5 |
| Texto de review | Campo de texto libre (opcional) para escribir la opinión |
| Editar review | Modificar una review existente |
| Eliminar review | Borrar una review propia |
| Ver mis reviews | Lista de todas las reviews del usuario actual |
| Estado de visto | Marcar como "visto", "quiero ver", "abandoné" |

### 👥 Grupos

| Feature | Descripción |
|---|---|
| Crear grupo | El usuario puede crear un grupo con nombre y descripción |
| Invitar miembros | Invitar amigos al grupo por nombre de usuario o código |
| Ver miembros | Lista de miembros del grupo |
| Reviews del grupo | Ver todas las reviews de los miembros sobre una misma película/serie |
| Puntaje grupal | Promedio de puntajes de todos los miembros del grupo |
| Ranking grupal | Ordenar películas/series por puntaje promedio del grupo |
| Grupos públicos | Grupos donde cualquier usuario puede unirse |
| Grupos privados | Solo por invitación |

### 👤 Perfil de usuario

| Feature | Descripción |
|---|---|
| Perfil básico | Nombre, avatar, bio |
| Estadísticas personales | Total de reviews, géneros favoritos, promedio dado |
| Lista de reviews | Historial de todas sus reviews |

---

## Out of scope v1 (futuro)

Estas features están identificadas pero **no entran en v1**:

- Comentarios en reviews (threading)
- Reacciones / likes a reviews
- Notificaciones push
- Feed de actividad en tiempo real
- Soporte para libros, videojuegos, música, podcasts
- Listas personalizadas ("Top 10 de terror")
- Integración con streaming (Netflix, Disney+)
- Sistema de recomendaciones basado en gustos del grupo
- Exportar reviews (PDF, CSV)
- Autenticación y backend real (v2)

---

## v2 — Con Backend

Cuando se agregue el backend, las features a priorizar son:

1. **Autenticación real** (email/password + OAuth con Google)
2. **Persistencia en base de datos** (migrar desde localStorage)
3. **Grupos en tiempo real** (WebSockets o polling)
4. **Notificaciones** (alguien reviewó algo que vos también)
5. **Feed social** de actividad reciente del grupo
6. **API pública** para integraciones futuras

---

## v3 — Expansión de contenido

1. **Libros** — con integración a Google Books API
2. **Videojuegos** — con integración a RAWG o IGDB
3. **Música / álbumes** — con Spotify o MusicBrainz
4. **Podcasts** — con integración a Spotify Podcasts API
5. **Sistema unificado de "Things"** — cualquier cosa reviewable

---

## Campos de la Review (universal)

La Review es el único modelo central — aplica a **cualquier tipo de contenido**. El campo `contentType` es el que distingue de qué se trata.

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `string` (UUID) | ✅ | Identificador único |
| `userId` | `string` | ✅ | FK al usuario que escribe la review |
| `contentId` | `string` | ✅ | FK al item reviewado (película, juego, álbum, etc.) |
| `contentType` | `ContentType` | ✅ | Discriminador: `'movie'` \| `'series'` \| `'music'` \| `'game'` \| `'book'` \| `'podcast'` |
| `rating` | `number` (1-5) | ❌ | Puntaje en estrellas (requerido si `status = 'consumed'`) |
| `title` | `string` | ❌ | Título opcional para la review (máx 100 chars) |
| `body` | `string` | ❌ | Texto libre de opinión (máx 2000 chars) |
| `containsSpoilers` | `boolean` | ✅ | Alerta de spoilers |
| `status` | `ConsumptionStatus` | ✅ | `'consumed'` \| `'want_to_consume'` \| `'consuming'` \| `'dropped'` |
| `metadata` | `ReviewMetadata` | ❌ | Campos extra específicos del tipo de contenido |
| `consumedAt` | `Date` | ❌ | Cuándo fue consumido (visto, jugado, leído, etc.) |
| `createdAt` | `Date` | ✅ | Fecha de creación |
| `updatedAt` | `Date` | ✅ | Última modificación |

### Metadata por tipo de contenido (campo `metadata`)

La UI muestra los campos extra según el `contentType` de la review:

| Tipo | Campos extra disponibles |
|---|---|
| `series` | Temporada actual, episodio actual, rating por temporada |
| `game` | Plataforma jugada, horas jugadas, % completado, dificultad |
| `book` | Página actual, formato (físico / ebook / audiolibro) |
| `podcast` | Episodios escuchados |
| `movie` | — (no tiene campos extra) |
| `music` | — (no tiene campos extra) |

---

## Reglas de negocio

1. Un usuario **solo puede tener una review por `contentId`**, independientemente del tipo. Si crea otra, reemplaza la anterior.
2. El **puntaje grupal** es el promedio aritmético de todos los `rating` del grupo para ese `contentId`.
3. Un usuario puede pertenecer a **múltiples grupos**.
4. Para calcular el puntaje grupal, se requiere **mínimo 2 reviews con rating** del grupo sobre ese item.
5. El estado `want_to_consume` no requiere `rating` (todavía no lo consumieron).
6. Si `status = 'dropped'`, el `rating` es opcional.
7. El label del `status` en la UI cambia según el `contentType` (ej: `consumed` → "Vista" para películas, "Jugado" para juegos).
