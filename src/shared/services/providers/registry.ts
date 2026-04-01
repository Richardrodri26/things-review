import type { ContentType } from '@/shared/types'
import type {
  ContentProvider,
  ProviderItemDetail,
  ProviderSearchResult,
  ProvidersSearchResponse,
} from './types'

const DEFAULT_TIMEOUT_MS = 5000

class ProviderRegistry {
  private providers = new Map<string, ContentProvider>()

  register(provider: ContentProvider): void {
    this.providers.set(provider.id, provider)
  }

  getForContentType(contentType: ContentType): ContentProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.supportedContentTypes.includes(contentType)
    )
  }

  getById(id: string): ContentProvider | undefined {
    return this.providers.get(id)
  }

  /**
   * Fan-out search: queries all providers for the given contentType in parallel.
   * Never throws — failed providers are recorded in the errors array.
   * Responds with whatever results are available within PROVIDER_TIMEOUT_MS.
   */
  async searchAll(query: string, contentType: ContentType): Promise<ProvidersSearchResponse> {
    const activeProviders = this.getForContentType(contentType)

    if (activeProviders.length === 0) {
      return { results: [], sources: [], errors: [] }
    }

    const settled = await Promise.allSettled(
      activeProviders.map((provider) =>
        Promise.race([
          provider.search(query, contentType),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Provider timeout')),
              provider.timeout ?? DEFAULT_TIMEOUT_MS
            )
          ),
        ]).then((results) => ({ provider, results }))
      )
    )

    const results: ProviderSearchResult[] = []
    const sources: string[] = []
    const errors: ProvidersSearchResponse['errors'] = []

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        results.push(...outcome.value.results)
        sources.push(outcome.value.provider.id)
      } else {
        const provider = activeProviders[settled.indexOf(outcome)]
        errors.push({
          providerId: provider?.id ?? 'unknown',
          message: outcome.reason instanceof Error ? outcome.reason.message : 'Unknown error',
        })
      }
    }

    return { results, sources, errors }
  }

  /**
   * Fetch full detail from a specific provider by its ID.
   * Returns null if the provider is not registered or returns nothing.
   */
  async getDetail(
    providerId: string,
    externalId: string,
    contentType: ContentType
  ): Promise<ProviderItemDetail | null> {
    const provider = this.getById(providerId)
    if (!provider) return null

    try {
      return await Promise.race([
        provider.getById(externalId, contentType),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Provider timeout')),
            provider.timeout ?? DEFAULT_TIMEOUT_MS
          )
        ),
      ])
    } catch {
      return null
    }
  }
}

// Singleton — providers are registered at module load time
export const providerRegistry = new ProviderRegistry()
