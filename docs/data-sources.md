# Sistema de Fuentes de Datos — Things Review

> Diseño del sistema de providers para precargar información de contenido desde fuentes externas.

---

## El problema

Un usuario quiere crear una review de "The Last of Us". Tiene dos caminos:

1. **Cargar todo a mano:** título, año, géneros, imagen... tedioso y propenso a errores.
2. **Buscar en una fuente externa:** escribís el nombre, aparece la info precargada, confirmás y listo.

El segundo camino es el ideal. Pero **la fuente no debe ser bloqueante**: si no hay internet, si la API está caída, o si el contenido simplemente no existe en ninguna fuente, el usuario igual puede crear la review a mano.

---

## Diseño: patrón Provider

Cada fuente de datos es un **ContentProvider** — un objeto que implementa una interfaz fija. La app no sabe ni le importa si está hablando con TMDB, RAWG o una fuente custom. Solo llama a la interfaz.

```typescript
// La interfaz que TODA fuente debe implementar
interface ContentProvider {
  // Identificador único de la fuente (ej: 'tmdb', 'rawg')
  readonly id: string

  // Nombre legible para mostrar en la UI (ej: 'The Movie Database')
  readonly displayName: string

  // Íconos / logo de la fuente
  readonly logoUrl?: string

  // Qué tipos de contenido puede proveer esta fuente
  readonly supportedContentTypes: ContentType[]

  // Buscar items por texto libre
  search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]>

  // Obtener el detalle completo de un item por su ID externo
  getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null>
}
```

### El resultado de búsqueda (mínimo para mostrar en la lista)

```typescript
interface ProviderSearchResult {
  externalId: string            // ID en la fuente (ej: '550' en TMDB)
  providerId: string            // Qué fuente lo encontró (ej: 'tmdb')
  contentType: ContentType      // Tipo de contenido
  title: string                 // Título
  year?: number                 // Año (puede no estar disponible)
  coverImageUrl?: string        // Imagen de portada
  overview?: string             // Sinopsis corta
}
```

### El detalle completo (para precargar el formulario)

```typescript
interface ProviderItemDetail {
  externalId: string
  providerId: string
  contentType: ContentType

  // Campos que mapean directamente a ReviewableItem
  title: string
  year: number
  coverImageUrl?: string
  genres: Genre[]
  overview?: string

  // Campos extra que cada tipo de contenido puede necesitar
  // Cada provider mapea lo que tiene a esta estructura
  extra: Record<string, unknown>
}
```

---

## Flujo de uso (desde la perspectiva del usuario)

```
Usuario abre "Crear review"
  │
  ├─► Escribe el nombre de lo que quiere reviewar
  │     │
  │     ├─► Si hay providers configurados para ese contentType:
  │     │     - Se disparan búsquedas en paralelo en todos los providers activos
  │     │     - Aparecen resultados debajo del input (como un autocomplete)
  │     │     - Cada resultado muestra de qué fuente viene (badge "TMDB", "RAWG", etc.)
  │     │
  │     └─► Si no hay providers o no hay resultados:
  │           - El formulario queda vacío pero editable
  │           - El usuario completa los campos a mano
  │           - Sin error, sin bloqueo
  │
  ├─► Usuario selecciona un resultado de la búsqueda:
  │     - Se llama a provider.getById() para traer el detalle completo
  │     - Los campos del formulario se precargan (título, año, imagen, géneros...)
  │     - El usuario puede editar cualquier campo precargado antes de guardar
  │     - Se guarda el externalId y providerId en el ReviewableItem para referencia
  │
  └─► Usuario guarda sin seleccionar nada de la búsqueda:
        - Se crea el ReviewableItem con source: 'manual'
        - Sin externalId, sin providerId
```

---

## Implementaciones de providers (v1 y futuras)

### Providers en v1

| Provider | ID | Tipos soportados | API | Requiere key |
|---|---|---|---|---|
| TMDB | `tmdb` | `movie`, `series` | REST pública | ✅ Sí (gratuita) |
| Manual | `manual` | Todos | — | ❌ No |

### Providers futuros (v3+)

| Provider | ID | Tipos soportados | API | Requiere key |
|---|---|---|---|---|
| RAWG | `rawg` | `game` | REST pública | ✅ Sí (gratuita) |
| Google Books | `google_books` | `book` | REST pública | ✅ Sí (gratuita) |
| Spotify | `spotify` | `music`, `podcast` | REST OAuth | ✅ Sí |
| MusicBrainz | `musicbrainz` | `music` | REST pública | ❌ No |
| OpenLibrary | `openlibrary` | `book` | REST pública | ❌ No |

---

## Implementación del provider TMDB (v1)

```typescript
// shared/services/providers/tmdb.provider.ts

class TMDBProvider implements ContentProvider {
  readonly id = 'tmdb'
  readonly displayName = 'The Movie Database'
  readonly logoUrl = 'https://www.themoviedb.org/assets/2/v4/logos/...'
  readonly supportedContentTypes: ContentType[] = ['movie', 'series']

  async search(query: string, contentType: ContentType): Promise<ProviderSearchResult[]> {
    const endpoint = contentType === 'movie' ? 'search/movie' : 'search/tv'
    const response = await fetch(
      `${TMDB_BASE_URL}/${endpoint}?query=${encodeURIComponent(query)}&api_key=${API_KEY}`
    )
    const data = await response.json()

    return data.results.map((item: TMDBSearchResult) => ({
      externalId: String(item.id),
      providerId: 'tmdb',
      contentType,
      title: item.title ?? item.name,
      year: new Date(item.release_date ?? item.first_air_date).getFullYear(),
      coverImageUrl: item.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
        : undefined,
      overview: item.overview,
    }))
  }

  async getById(externalId: string, contentType: ContentType): Promise<ProviderItemDetail | null> {
    const endpoint = contentType === 'movie' ? `movie/${externalId}` : `tv/${externalId}`
    const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${API_KEY}`)
    if (!response.ok) return null

    const data = await response.json()
    return this.mapToItemDetail(data, contentType)
  }

  private mapToItemDetail(data: TMDBMovieDetail | TMDBSeriesDetail, contentType: ContentType): ProviderItemDetail {
    return {
      externalId: String(data.id),
      providerId: 'tmdb',
      contentType,
      title: 'title' in data ? data.title : data.name,
      year: new Date('release_date' in data ? data.release_date : data.first_air_date).getFullYear(),
      coverImageUrl: data.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${data.poster_path}` : undefined,
      genres: data.genres.map(g => ({ id: String(g.id), name: g.name })),
      overview: data.overview,
      extra: data,   // guardamos todo el raw por si se necesita más adelante
    }
  }
}
```

---

## Registry de providers

Un registro central que sabe qué providers están activos. Es el único lugar que cambia cuando se agrega una nueva fuente.

```typescript
// shared/services/providers/registry.ts

class ProviderRegistry {
  private providers = new Map<string, ContentProvider>()

  register(provider: ContentProvider): void {
    this.providers.set(provider.id, provider)
  }

  getForContentType(contentType: ContentType): ContentProvider[] {
    return Array.from(this.providers.values()).filter(
      p => p.supportedContentTypes.includes(contentType)
    )
  }

  getById(id: string): ContentProvider | undefined {
    return this.providers.get(id)
  }
}

// Instancia global — acá se registran los providers activos
export const providerRegistry = new ProviderRegistry()

// v1: solo TMDB
providerRegistry.register(new TMDBProvider())

// v3: descomentar cuando estén listos
// providerRegistry.register(new RAWGProvider())
// providerRegistry.register(new GoogleBooksProvider())
// providerRegistry.register(new SpotifyProvider())
```

---

## Cómo agregar un nuevo provider en el futuro

Para agregar una nueva fuente de datos, **solo hay que hacer 2 cosas**:

1. Crear el archivo `shared/services/providers/<nombre>.provider.ts` implementando `ContentProvider`
2. Registrarlo en `registry.ts` con `providerRegistry.register(new NuevoProvider())`

El resto de la app — formularios, búsqueda, caché — funciona sin cambios.

---

## Impacto en el modelo `ReviewableItem`

El campo `source` en `ReviewableItem` deja de ser un simple string hardcodeado y pasa a ser la referencia a qué provider lo originó:

```typescript
interface ReviewableItem {
  id: string
  contentType: ContentType
  // Antes: source: 'tmdb' | 'rawg' | 'local'
  // Ahora: referencia dinámica al provider
  providerId: string            // ID del provider ('tmdb', 'rawg', 'manual', ...)
  externalId?: string           // ID en la fuente original (para re-fetch si se necesita)
  title: string
  coverImageUrl?: string
  year: number
  genres: Genre[]
  overview?: string
  createdAt: Date
}
```

Si `providerId === 'manual'`, el item fue creado a mano y `externalId` es `undefined`. Sin excepción, sin bloqueo.

---

## Consideraciones de UX

- **La búsqueda es sugerencia, no obligación.** El formulario siempre es editable aunque se precargue desde un provider.
- **Indicar la fuente en los resultados.** Mostrar un badge con el nombre del provider para que el usuario sepa de dónde viene la info.
- **Búsqueda con debounce.** No disparar requests en cada keystroke — esperar 300ms de pausa.
- **Si el provider falla,** mostrar el campo de búsqueda vacío con un mensaje sutil ("No se pudo conectar con TMDB"). El formulario manual sigue disponible.
- **Los datos precargados no son sagrados.** El usuario puede editar el título, cambiar la imagen, etc. antes de guardar.
