'use client'

// src/features/reviews/components/ContentPicker.tsx
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, ChevronDownIcon, GlobeIcon, LibraryIcon, Loader2Icon, SearchIcon, XIcon, AlertCircleIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CoverImage } from '@/shared/ui/atoms/CoverImage'
import { cn } from '@/lib/utils'
import { useCatalogByType } from '@/features/catalog/hooks/useCatalog'
import { useProviderSearch, useAddFromProvider } from '@/features/catalog/hooks/useProviderSearch'
import type { ContentType } from '@/shared/types'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ProviderSearchResult } from '@/shared/services/providers/types'

const CONTENT_TYPES: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

// Provider display names — matches the id field in each provider class
const PROVIDER_LABELS: Record<string, string> = {
  tmdb: 'TMDB',
  rawg: 'RAWG',
  musicbrainz: 'MusicBrainz',
  openlibrary: 'Open Library',
  itunes: 'iTunes',
  igdb: 'IGDB',
  lastfm: 'Last.fm',
  googlebooks: 'Google Books',
}

interface ContentPickerProps {
  /** Tipo de contenido seleccionado actualmente */
  contentType: ContentType
  /** ID del item seleccionado actualmente */
  contentId: string
  /** Callback al cambiar tipo — también limpia el contentId */
  onTypeChange: (type: ContentType) => void
  /** Callback al seleccionar un item del catálogo */
  onItemChange: (id: string) => void
  /** Clase CSS adicional para el contenedor */
  className?: string
  /** Tamaño compacto para el sidebar del editor */
  compact?: boolean
  /** Deshabilitar el selector de tipo (cuando viene prefillado) */
  disableType?: boolean
}

/**
 * Picker de 2 pasos:
 * 1. Select de contentType
 * 2. Lista filtrable — tab "My Catalog" (local) o "Discover" (providers externos)
 */
export function ContentPicker({
  contentType,
  contentId,
  onTypeChange,
  onItemChange,
  className,
  compact = false,
  disableType = false,
}: ContentPickerProps) {
  const t = useTranslations('reviews.contentPicker')
  const tContentType = useTranslations('contentType')
  const tCommon = useTranslations('common')

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [discoverMode, setDiscoverMode] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const { data: items = [], isLoading: catalogLoading } = useCatalogByType(contentType)

  const { data: providerData, isFetching: providerFetching } = useProviderSearch(
    search,
    contentType,
    open && discoverMode
  )

  const addFromProvider = useAddFromProvider()

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(q))
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === contentId),
    [items, contentId]
  )

  const typeLabel = tContentType(contentType)

  function handleTypeChange(value: string | null) {
    if (!value) return
    onTypeChange(value as ContentType)
    onItemChange('')
    setSearch('')
    setDiscoverMode(false)
  }

  function handleSelectItem(id: string) {
    onItemChange(id)
    setOpen(false)
    setSearch('')
    setDiscoverMode(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onItemChange('')
    setSearch('')
  }

  function handleClose() {
    setOpen(false)
    setSearch('')
  }

  async function handleSelectProviderResult(result: ProviderSearchResult) {
    const key = `${result.providerId}:${result.externalId}`
    setAddingId(key)
    try {
      const item = await addFromProvider.mutateAsync(result)
      handleSelectItem(item.id)
    } finally {
      setAddingId(null)
    }
  }

  const providerResults = providerData?.results ?? []
  const providerErrors = providerData?.errors ?? []
  const isProviderSearching = providerFetching && search.trim().length >= 2

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Paso 1: tipo */}
      {!disableType && (
        <Select value={contentType} onValueChange={handleTypeChange}>
          <SelectTrigger className={cn('w-full', compact ? 'h-8 text-xs' : '')}>
            <SelectValue placeholder={t('selectType')}>
              {(v: string | null) => {
                if (!v) return t('selectType')
                const ct = CONTENT_TYPE_LABELS[v as ContentType]
                return ct ? `${ct.icon} ${tContentType(v as ContentType)}` : v
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((type) => {
              const { icon: ic } = CONTENT_TYPE_LABELS[type]
              return (
                <SelectItem key={type} value={type} className={compact ? 'text-xs' : ''}>
                  {ic} {tContentType(type)}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}

      {/* Paso 2: item */}
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-2 text-left',
            'ring-offset-background transition-colors',
            'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            compact ? 'h-8 gap-1.5 text-xs' : 'h-10 gap-2 text-sm',
          )}
        >
          {selectedItem ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn('relative shrink-0 overflow-hidden rounded-sm', compact ? 'size-5' : 'h-8 w-[22px]')}>
                <CoverImage src={selectedItem.coverImageUrl} alt={selectedItem.title} contentType={contentType} sizes="32px" className="object-cover" iconSize={compact ? 'text-[10px]' : 'text-xs'} showTitle={false} />
              </span>
              <span className="truncate font-medium">{selectedItem.title}</span>
            </span>
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
              <span className={cn('relative shrink-0 overflow-hidden rounded-sm', compact ? 'size-5' : 'h-8 w-[22px]')}>
                <CoverImage src={null} alt="" contentType={contentType} sizes="32px" iconSize={compact ? 'text-[10px]' : 'text-xs'} showTitle={false} />
              </span>
              <span className="truncate">{t('selectItem', { type: typeLabel.toLowerCase() })}</span>
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            {selectedItem && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label={t('clearSelection')}
              >
                <XIcon className={compact ? 'size-3' : 'size-3.5'} />
              </span>
            )}
            <ChevronDownIcon className={cn(compact ? 'size-3' : 'size-3.5', 'text-muted-foreground', open && 'rotate-180 transition-transform')} />
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setDiscoverMode(false)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors',
                  !discoverMode
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LibraryIcon className="size-3" />
                {t('tabCatalog')}
              </button>
              <button
                type="button"
                onClick={() => setDiscoverMode(true)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors',
                  discoverMode
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <GlobeIcon className="size-3" />
                {t('tabDiscover')}
              </button>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  discoverMode
                    ? t('discoverPlaceholder', { type: typeLabel.toLowerCase() })
                    : t('searchItem', { type: typeLabel.toLowerCase() })
                }
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              {isProviderSearching && (
                <Loader2Icon className="size-3 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Lista — Catalog mode */}
            {!discoverMode && (
              <div className="max-h-52 overflow-y-auto p-1">
                {catalogLoading ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">{tCommon('loading')}</p>
                ) : filtered.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {search ? t('noResultsSearch') : t('noResultsCatalog', { type: typeLabel.toLowerCase() })}
                  </p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs',
                        'hover:bg-accent hover:text-accent-foreground',
                        item.id === contentId && 'bg-accent/60 font-medium',
                      )}
                    >
                      <span className="relative size-7 shrink-0 overflow-hidden rounded-sm">
                        <CoverImage src={item.coverImageUrl} alt="" contentType={contentType} sizes="28px" className="object-cover" iconSize="text-sm" showTitle={false} />
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="truncate font-medium leading-tight">{item.title}</span>
                        <span className="truncate text-[10px] text-muted-foreground leading-tight">{item.year}</span>
                      </span>
                      {item.id === contentId && <CheckIcon className="ml-auto size-3 shrink-0 text-primary" />}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Lista — Discover mode */}
            {discoverMode && (
              <div className="max-h-64 overflow-y-auto p-1">
                {search.trim().length < 2 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">{t('discoverEmpty')}</p>
                ) : isProviderSearching ? (
                  /* Skeleton while loading */
                  <div className="space-y-1 p-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 rounded-sm px-2 py-1.5">
                        <div className="size-7 shrink-0 animate-pulse rounded-sm bg-muted" />
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-2 w-1/3 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Provider errors warning */}
                    {providerErrors.length > 0 && (
                      <div className="mx-1 mb-1 flex items-center gap-1.5 rounded-sm bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                        <AlertCircleIcon className="size-3 shrink-0" />
                        <span>{t('providerErrors', { count: providerErrors.length })}</span>
                      </div>
                    )}
                    {providerResults.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">{t('discoverNoResults')}</p>
                    ) : (
                      providerResults.map((result) => {
                        const key = `${result.providerId}:${result.externalId}`
                        const isAdding = addingId === key
                        const providerLabel = PROVIDER_LABELS[result.providerId] ?? result.providerId

                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={isAdding}
                            onClick={() => handleSelectProviderResult(result)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs',
                              'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60',
                            )}
                          >
                            {/* Cover image */}
                            <span className="relative size-7 shrink-0 overflow-hidden rounded-sm">
                              <CoverImage
                                src={result.coverImageUrl}
                                alt=""
                                contentType={contentType}
                                sizes="28px"
                                className="object-cover"
                                iconSize="text-sm"
                                showTitle={false}
                              />
                            </span>

                            {/* Title + year + streaming */}
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate font-medium leading-tight">{result.title}</span>
                              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground leading-tight">
                                {result.year && <span>{result.year}</span>}
                                {result.streamingAvailability && result.streamingAvailability.length > 0 && (
                                  <span className="truncate">
                                    · {result.streamingAvailability
                                      .filter((s) => s.type === 'flatrate' || s.type === 'free')
                                      .slice(0, 2)
                                      .map((s) => s.name)
                                      .join(', ')}
                                  </span>
                                )}
                              </span>
                            </span>

                            {/* Provider badge + spinner */}
                            <span className="shrink-0 ml-auto flex items-center gap-1">
                              {isAdding ? (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Loader2Icon className="size-2.5 animate-spin" />
                                  {t('addingToCatalog')}
                                </span>
                              ) : (
                                <span className="rounded-sm bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {providerLabel}
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click-outside para cerrar */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  )
}
