// Provider registry — import this module to initialize all providers.
// The registry is a singleton; importing ensures providers are registered.

import { providerRegistry } from './registry'
import { TMDBProvider } from './tmdb'
import { RAWGProvider } from './rawg'
import { MusicBrainzProvider } from './musicbrainz'
import { OpenLibraryProvider } from './openlibrary'
import { ItunesProvider } from './itunes'

providerRegistry.register(new TMDBProvider())
providerRegistry.register(new RAWGProvider())
providerRegistry.register(new MusicBrainzProvider())
providerRegistry.register(new OpenLibraryProvider())
providerRegistry.register(new ItunesProvider())

export { providerRegistry }
export type { ContentProvider, ProviderSearchResult, ProviderItemDetail, ProvidersSearchResponse } from './types'
