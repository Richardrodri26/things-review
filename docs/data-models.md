# Data Models — Things Review

> Todos los tipos están definidos en TypeScript con sus correspondientes schemas Zod.

---

## Principio de diseño: contenido genérico desde el inicio

La app se llama **Things Review** — "things" es intencional. El modelo está diseñado para soportar cualquier tipo de contenido reviewable. La `Review` identifica **qué tipo de cosa** se está reviewando mediante `contentType`, y cada tipo de contenido tiene su propio modelo con campos específicos.

```
Review
  ├── contentType: ContentType   → identifica el tipo ('movie' | 'series' | 'music' | 'game' | ...)
  ├── contentId: string          → FK al item del tipo correspondiente
  └── metadata?: ReviewMetadata → campos extra según el tipo (progreso de serie, plataforma de juego, etc.)
```

---

## Entidades del dominio

### 1. User

Representa al usuario de la aplicación. En v1 es un perfil local.

```typescript
interface User {
  id: string                    // UUID generado localmente
  username: string              // Nombre de usuario único
  displayName: string           // Nombre a mostrar
  avatarUrl?: string            // URL del avatar (opcional)
  bio?: string                  // Descripción corta del perfil
  createdAt: Date               // Fecha de creación
  updatedAt: Date               // Última modificación
}
```

**Campos calculados (no persistidos):**
- `totalReviews` — count de sus reviews
- `averageRating` — promedio de ratings dados
- `favoriteContentTypes` — tipos de contenido más reviewados
- `favoriteGenres` — géneros más frecuentes en sus reviews

---

### 2. ContentType — El discriminador central

Este es el campo clave que identifica qué tipo de cosa se está reviewando.

```typescript
type ContentType =
  | 'movie'       // Películas
  | 'series'      // Series / TV Shows
  | 'music'       // Álbumes / EPs / Singles
  | 'game'        // Videojuegos
  | 'book'        // Libros
  | 'podcast'     // Podcasts

// Helper para mostrar labels en UI
const CONTENT_TYPE_LABELS: Record<ContentType, { en: string; es: string; icon: string }> = {
  movie:   { en: 'Movie',      es: 'Película',    icon: '🎬' },
  series:  { en: 'Series',     es: 'Serie',       icon: '📺' },
  music:   { en: 'Music',      es: 'Música',      icon: '🎵' },
  game:    { en: 'Game',       es: 'Videojuego',  icon: '🎮' },
  book:    { en: 'Book',       es: 'Libro',       icon: '📚' },
  podcast: { en: 'Podcast',    es: 'Podcast',     icon: '🎙️' },
}
```

> **v1:** Solo `movie` y `series` están completamente implementados. Los demás tipos están definidos en el modelo pero sus pantallas de búsqueda/detalle se construyen en v3.

---

### 3. ReviewableItem — La interfaz base de todo contenido

Todos los tipos de contenido comparten esta estructura base. Permite tratarlos de forma genérica en listados, búsquedas y la Review.

```typescript
interface ReviewableItem {
  id: string                    // UUID local (generado al guardar en nuestro sistema)
  contentType: ContentType      // Discriminador del tipo
  providerId: string            // Qué fuente originó este item ('tmdb', 'rawg', 'manual', ...)
  externalId?: string           // ID en la fuente original (undefined si fue creado a mano)
  title: string                 // Título principal
  coverImageUrl?: string        // Imagen de portada (póster, album art, etc.)
  year: number                  // Año de lanzamiento/publicación
  genres: Genre[]               // Géneros (cuando aplica)
  overview?: string             // Sinopsis / descripción corta
  createdAt: Date               // Cuándo se guardó en nuestro sistema
}
```

> `providerId` es dinámico — lo resuelve el registry de providers. Ver [data-sources.md](./data-sources.md) para el diseño completo del sistema de fuentes.

---

### 4. Movie

Extiende `ReviewableItem` con campos específicos de películas.

```typescript
interface Movie extends ReviewableItem {
  contentType: 'movie'          // Siempre 'movie'
  originalTitle?: string        // Título en idioma original
  runtime?: number              // Duración en minutos
  originalLanguage: string      // Idioma original ('en', 'es', etc.)
  adult: boolean                // Contenido adulto
  backdropImageUrl?: string     // Imagen de fondo (para el detalle)
  releaseDate: string           // Fecha de estreno (ISO string)
  // externalId (heredado de ReviewableItem) → ID en TMDB si providerId === 'tmdb'
}
```

---

### 5. Series

Extiende `ReviewableItem` con campos específicos de series.

```typescript
interface Series extends ReviewableItem {
  contentType: 'series'         // Siempre 'series'
  originalTitle?: string
  firstAirDate: string          // Fecha del primer episodio
  lastAirDate?: string          // Fecha del último episodio (si terminó)
  numberOfSeasons: number       // Total de temporadas
  numberOfEpisodes: number      // Total de episodios
  status: SeriesStatus
  originalLanguage: string
  adult: boolean
  backdropImageUrl?: string
  networks?: Network[]          // Plataformas/canales
}

type SeriesStatus =
  | 'returning_series'          // En emisión
  | 'ended'                     // Finalizada
  | 'canceled'                  // Cancelada
  | 'in_production'             // En producción
  | 'planned'                   // Anunciada

interface Network {
  id: string
  name: string
  logoUrl?: string
}
```

---

### 6. MusicAlbum

```typescript
interface MusicAlbum extends ReviewableItem {
  contentType: 'music'
  artist: string                // Artista o banda principal
  albumType: MusicAlbumType     // Tipo de lanzamiento
  totalTracks: number           // Cantidad de canciones
  durationMs?: number           // Duración total en milisegundos
  label?: string                // Sello discográfico
  // externalId (heredado de ReviewableItem) → ID en Spotify si providerId === 'spotify'
}

type MusicAlbumType = 'album' | 'ep' | 'single' | 'compilation'
```

---

### 7. Game

```typescript
interface Game extends ReviewableItem {
  contentType: 'game'
  developer?: string            // Estudio desarrollador
  publisher?: string            // Publisher
  platforms: GamePlatform[]     // Plataformas disponibles
  metacriticScore?: number      // Score de Metacritic (referencia)
  // externalId (heredado de ReviewableItem) → ID en RAWG si providerId === 'rawg'
}

type GamePlatform =
  | 'pc'
  | 'playstation_5'
  | 'playstation_4'
  | 'xbox_series'
  | 'xbox_one'
  | 'nintendo_switch'
  | 'mobile'
  | 'other'
```

---

### 8. Book

```typescript
interface Book extends ReviewableItem {
  contentType: 'book'
  author: string[]              // Puede haber múltiples autores
  isbn?: string                 // ISBN-13
  pageCount?: number            // Cantidad de páginas
  publisher?: string
  language: string              // Idioma original
  // externalId (heredado de ReviewableItem) → ID en Google Books si providerId === 'google_books'
}
```

---

### 9. Podcast

```typescript
interface Podcast extends ReviewableItem {
  contentType: 'podcast'
  host: string[]                // Conductores
  totalEpisodes?: number
  language: string
  isActive: boolean             // Si sigue publicando episodios
  // externalId (heredado de ReviewableItem) → ID en Spotify si providerId === 'spotify'
}
```

---

### 10. Genre

```typescript
interface Genre {
  id: string
  name: string
  nameEs?: string               // Nombre en español
  applicableTo: ContentType[]   // A qué tipos de contenido aplica este género
}
```

---

### 11. Review

El corazón del sistema. Vincula un usuario con **cualquier tipo de contenido** reviewable.

```typescript
interface Review {
  id: string                    // UUID
  userId: string                // FK → User.id
  contentId: string             // FK → ReviewableItem.id (del tipo que sea)
  contentType: ContentType      // Discriminador — identifica el tipo del contenido

  // Rating
  rating?: Rating               // 1 | 2 | 3 | 4 | 5 (opcional según el status)

  // Contenido de la review
  title?: string                // Título opcional para la review (máx 100 chars)
  body?: string                 // Texto libre de la opinión (máx 2000 chars)
  containsSpoilers: boolean     // Alerta de spoilers

  // Estado de consumo (varía semánticamente según el tipo de contenido)
  status: ConsumptionStatus

  // Metadata específica por tipo de contenido
  metadata?: ReviewMetadata

  // Cuándo lo consumió
  consumedAt?: Date             // 'visto el', 'jugado el', 'leído el', etc.
  createdAt: Date
  updatedAt: Date
}

type Rating = 1 | 2 | 3 | 4 | 5

// Los estados semánticamente cambian según el tipo, pero los valores son los mismos
// movie/series: watched / want_to_watch / watching / dropped
// music:        listened / want_to_listen / listening / dropped
// game:         played / want_to_play / playing / dropped
// book:         read / want_to_read / reading / dropped
// En todos los casos el tipo es el mismo — la UI muestra el label correcto según el contentType
type ConsumptionStatus = 'consumed' | 'want_to_consume' | 'consuming' | 'dropped'
```

---

### 12. ReviewMetadata — Campos extra por tipo de contenido

Datos adicionales que solo tienen sentido para ciertos tipos de contenido. Todos opcionales.

```typescript
type ReviewMetadata =
  | SeriesReviewMetadata
  | GameReviewMetadata
  | BookReviewMetadata
  | PodcastReviewMetadata
  | null

// Solo para series
interface SeriesReviewMetadata {
  contentType: 'series'
  currentSeason?: number                          // Hasta qué temporada llegó
  currentEpisode?: number                         // Hasta qué episodio llegó
  seasonRatings?: Record<number, Rating>          // Rating por temporada (opcional)
}

// Solo para videojuegos
interface GameReviewMetadata {
  contentType: 'game'
  platform?: GamePlatform                         // En qué plataforma lo jugó
  hoursPlayed?: number                            // Horas jugadas
  completionPercent?: number                      // % completado (0-100)
  difficulty?: 'easy' | 'normal' | 'hard' | 'very_hard'
}

// Solo para libros
interface BookReviewMetadata {
  contentType: 'book'
  currentPage?: number                            // Hasta qué página llegó
  readingFormat?: 'physical' | 'ebook' | 'audiobook'
}

// Solo para podcasts
interface PodcastReviewMetadata {
  contentType: 'podcast'
  episodesListened?: number                       // Episodios escuchados
}
```

---

### 13. Group

Un grupo de usuarios que comparten reviews de **cualquier tipo** de contenido.

```typescript
interface Group {
  id: string                    // UUID
  name: string                  // Nombre del grupo (máx 50 chars)
  description?: string          // Descripción (máx 200 chars)
  avatarUrl?: string            // Avatar del grupo
  visibility: GroupVisibility   // 'public' | 'private'
  inviteCode: string            // Código de 8 chars para invitar
  ownerId: string               // FK → User.id (creador)
  memberIds: string[]           // Array de FK → User.id
  focusContentTypes?: ContentType[]  // Tipos de contenido del grupo (opcional, null = todos)
  createdAt: Date
  updatedAt: Date
}

type GroupVisibility = 'public' | 'private'
```

> `focusContentTypes` permite grupos temáticos: un grupo solo de videojuegos, uno solo de libros, etc. Si es `null` o vacío, acepta reviews de cualquier tipo.

---

### 15. Comment

Un comentario que un miembro del grupo deja sobre la review de otro miembro. El contexto siempre es doble: a qué grupo pertenece la conversación y sobre qué review se está comentando.

```typescript
interface Comment {
  id: string                    // UUID
  reviewId: string              // FK → Review.id (la review que se comenta)
  groupId: string               // FK → Group.id (en qué grupo ocurre la conversación)
  authorId: string              // FK → User.id (quien comenta)
  body: string                  // Texto del comentario (máx 500 chars)
  createdAt: Date
  updatedAt: Date
}
```

**Reglas de negocio del modelo:**
- Solo pueden comentar **miembros del grupo** donde ocurre la conversación.
- El autor de la review **puede comentar su propia review** (para responder).
- Un mismo usuario puede dejar **múltiples comentarios** en la misma review (no hay límite de uno por usuario como en las reviews).
- `body` es requerido, mínimo 1 caracter, máximo 500.
- Solo el autor del comentario puede **editarlo o eliminarlo**.

---

### 14. GroupMembership

```typescript
interface GroupMembership {
  userId: string                // FK → User.id
  groupId: string               // FK → Group.id
  role: GroupRole
  joinedAt: Date
}

type GroupRole = 'owner' | 'admin' | 'member'
```

---

## DTOs (Data Transfer Objects)

```typescript
// Review
type CreateReviewDTO = Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
type UpdateReviewDTO = Partial<Pick<Review,
  'rating' | 'title' | 'body' | 'containsSpoilers' | 'status' | 'consumedAt' | 'metadata'
>>

// Comment
type CreateCommentDTO = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
type UpdateCommentDTO = Pick<Comment, 'body'>

// Group
type CreateGroupDTO = Omit<Group, 'id' | 'inviteCode' | 'memberIds' | 'createdAt' | 'updatedAt'>
type UpdateGroupDTO = Partial<Pick<Group, 'name' | 'description' | 'avatarUrl' | 'visibility' | 'focusContentTypes'>>

// User
type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
type UpdateUserDTO = Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>
```

---

## Tipos calculados (derived data)

```typescript
// Puntaje grupal de cualquier item reviewable
interface GroupRatingSummary {
  contentId: string
  contentType: ContentType       // Ahora identifica el tipo del item
  groupId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<Rating, number>
  reviews: ReviewWithUser[]
}

// Review con datos del autor embebidos (para display)
interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

// Comentario con datos del autor embebidos (para display)
interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

// Review en el contexto de un grupo: incluye sus comentarios de ese grupo
interface ReviewInGroup extends ReviewWithUser {
  comments: CommentWithAuthor[]    // Comentarios de este grupo sobre esta review
  commentCount: number             // Total de comentarios
}

// Item reviewable con su review del usuario actual (para el catálogo)
interface ReviewableItemWithUserReview {
  item: ReviewableItem           // El item genérico (Movie, Series, Game, etc.)
  userReview?: Review            // La review del usuario actual, si existe
}

// Estadísticas del perfil de usuario
interface UserStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<Rating, number>
  reviewsByContentType: Record<ContentType, number>   // Cuántas reviews por tipo
  topGenres: Array<{ genre: Genre; count: number }>
  recentActivity: ReviewWithUser[]
}
```

---

## Labels de ConsumptionStatus según ContentType

El campo `status` es genérico (`consumed` / `want_to_consume` / `consuming` / `dropped`), pero la UI muestra el label semántico correcto según el tipo:

```typescript
const CONSUMPTION_STATUS_LABELS: Record<
  ConsumptionStatus,
  Record<ContentType, { en: string; es: string }>
> = {
  consumed: {
    movie:   { en: 'Watched',   es: 'Vista' },
    series:  { en: 'Watched',   es: 'Vista' },
    music:   { en: 'Listened',  es: 'Escuchado' },
    game:    { en: 'Played',    es: 'Jugado' },
    book:    { en: 'Read',      es: 'Leído' },
    podcast: { en: 'Listened',  es: 'Escuchado' },
  },
  want_to_consume: {
    movie:   { en: 'Want to Watch', es: 'Quiero verla' },
    series:  { en: 'Want to Watch', es: 'Quiero verla' },
    music:   { en: 'Want to Listen', es: 'Quiero escucharlo' },
    game:    { en: 'Want to Play',  es: 'Quiero jugarlo' },
    book:    { en: 'Want to Read',  es: 'Quiero leerlo' },
    podcast: { en: 'Want to Listen', es: 'Quiero escucharlo' },
  },
  consuming: {
    movie:   { en: 'Watching',  es: 'Viendo' },
    series:  { en: 'Watching',  es: 'Viendo' },
    music:   { en: 'Listening', es: 'Escuchando' },
    game:    { en: 'Playing',   es: 'Jugando' },
    book:    { en: 'Reading',   es: 'Leyendo' },
    podcast: { en: 'Listening', es: 'Escuchando' },
  },
  dropped: {
    movie:   { en: 'Dropped',   es: 'Abandonada' },
    series:  { en: 'Dropped',   es: 'Abandonada' },
    music:   { en: 'Dropped',   es: 'Abandonado' },
    game:    { en: 'Dropped',   es: 'Abandonado' },
    book:    { en: 'Dropped',   es: 'Abandonado' },
    podcast: { en: 'Dropped',   es: 'Abandonado' },
  },
}
```

---

## Persistencia en localStorage (v1)

```typescript
const STORAGE_KEYS = {
  USER: 'things-review:user',                    // User | null
  REVIEWS: 'things-review:reviews',              // Review[]
  COMMENTS: 'things-review:comments',            // Comment[]
  GROUPS: 'things-review:groups',                // Group[]
  MEMBERSHIPS: 'things-review:memberships',      // GroupMembership[]
  // Cachés por tipo de contenido
  CACHE_MOVIES: 'things-review:cache:movies',    // Record<string, Movie>
  CACHE_SERIES: 'things-review:cache:series',    // Record<string, Series>
  CACHE_MUSIC: 'things-review:cache:music',      // Record<string, MusicAlbum>
  CACHE_GAMES: 'things-review:cache:games',      // Record<string, Game>
  CACHE_BOOKS: 'things-review:cache:books',      // Record<string, Book>
  CACHE_PODCASTS: 'things-review:cache:podcasts',// Record<string, Podcast>
  SETTINGS: 'things-review:settings',            // AppSettings
} as const
```
