# Variables de entorno requeridas por el sistema de providers

Agregá estas variables a tu `.env.example` y `.env.local`:

```env
# ─── Content Providers ────────────────────────────────────────────────────────

# TMDB — movies + series + streaming availability (JustWatch data)
# Gratis sin límite de requests. Obtener en: https://www.themoviedb.org/settings/api
# Usar el "Read Access Token" (empieza con eyJ...), NO el API Key v3
TMDB_READ_ACCESS_TOKEN=

# Región para watch providers de TMDB (ISO 3166-1 alpha-2: US, AR, ES, etc.)
# Opcional — default: US
TMDB_WATCH_REGION=US

# RAWG — video games
# Gratis: 20,000 requests/mes. Obtener key en: https://rawg.io/apidocs
RAWG_API_KEY=

# ─── Providers opcionales ─────────────────────────────────────────────────────

# Last.fm — música (artwork + popularidad, complementa MusicBrainz)
# Gratis con rate limit. Obtener key en: https://www.last.fm/api/account/create
# LASTFM_API_KEY=

# Google Books — libros (mejor cobertura + imágenes que OpenLibrary)
# Gratis: 1,000 requests/día. Obtener key en: https://console.cloud.google.com
# GOOGLE_BOOKS_API_KEY=

# IGDB — video games (alternativa a RAWG, sin límite de requests)
# Requiere cuenta de Twitch Developer. Obtener en: https://api.igdb.com
# IGDB_CLIENT_ID=
# IGDB_CLIENT_SECRET=

# ─── Sin API key ──────────────────────────────────────────────────────────────
# MusicBrainz (música) — sin key, sin configuración necesaria
# OpenLibrary (libros)  — sin key, sin configuración necesaria
# iTunes Search (podcasts + música) — sin key, sin configuración necesaria
```
