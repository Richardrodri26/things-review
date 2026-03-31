'use client'

// src/features/reviews/components/ContentPicker.tsx
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import type { ContentType } from '@/shared/types'
import { CONTENT_TYPE_LABELS } from '@/shared/types'

const CONTENT_TYPES: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

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
 * 2. Lista filtrable de items del catálogo para ese tipo
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

  const { data: items = [], isLoading } = useCatalogByType(contentType)

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(q))
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === contentId),
    [items, contentId]
  )

  const { icon } = CONTENT_TYPE_LABELS[contentType]
  const typeLabel = tContentType(contentType)

  function handleTypeChange(value: string | null) {
    if (!value) return
    onTypeChange(value as ContentType)
    onItemChange('') // limpiar item al cambiar tipo
    setSearch('')
  }

  function handleSelectItem(id: string) {
    onItemChange(id)
    setOpen(false)
    setSearch('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onItemChange('')
    setSearch('')
  }

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

      {/* Paso 2: item del catálogo */}
      <div className="relative">
        {/* Trigger — muestra el item seleccionado o el placeholder */}
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
            /* Item seleccionado — thumbnail + título */
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className={cn(
                'relative shrink-0 overflow-hidden rounded-sm',
                compact ? 'size-5' : 'h-8 w-[22px]',
              )}>
                <CoverImage
                  src={selectedItem.coverImageUrl}
                  alt={selectedItem.title}
                  contentType={contentType}
                  sizes="32px"
                  className="object-cover"
                  iconSize={compact ? 'text-[10px]' : 'text-xs'}
                  showTitle={false}
                />
              </span>
              <span className="truncate font-medium">{selectedItem.title}</span>
            </span>
          ) : (
            /* Sin selección — placeholder con CoverImage igual que las cards */
            <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
              <span className={cn(
                'relative shrink-0 overflow-hidden rounded-sm',
                compact ? 'size-5' : 'h-8 w-[22px]',
              )}>
                <CoverImage
                  src={null}
                  alt=""
                  contentType={contentType}
                  sizes="32px"
                  iconSize={compact ? 'text-[10px]' : 'text-xs'}
                  showTitle={false}
                />
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
            {/* Búsqueda */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchItem', { type: typeLabel.toLowerCase() })}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Lista */}
            <div className="max-h-52 overflow-y-auto p-1">
              {isLoading ? (
                <p className="py-3 text-center text-xs text-muted-foreground">{tCommon('loading')}</p>
              ) : filtered.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  {search
                    ? t('noResultsSearch')
                    : t('noResultsCatalog', { type: typeLabel.toLowerCase() })}
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
                      <CoverImage
                        src={item.coverImageUrl}
                        alt=""
                        contentType={contentType}
                        sizes="28px"
                        className="object-cover"
                        iconSize="text-sm"
                        showTitle={false}
                      />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate font-medium leading-tight">{item.title}</span>
                      <span className="truncate text-[10px] text-muted-foreground leading-tight">{item.year}</span>
                    </span>
                    {item.id === contentId && (
                      <CheckIcon className="ml-auto size-3 shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click-outside para cerrar */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setOpen(false); setSearch('') }}
        />
      )}
    </div>
  )
}
