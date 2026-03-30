'use client'

// src/features/reviews/components/ContentPicker.tsx
import { useState, useMemo } from 'react'
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const { icon, en: typeLabel } = CONTENT_TYPE_LABELS[contentType]

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
            <SelectValue placeholder="Select type">
              {(v: string | null) => {
                if (!v) return 'Select type'
                const t = CONTENT_TYPE_LABELS[v as ContentType]
                return t ? `${t.icon} ${t.en}` : v
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((type) => {
              const { icon: ic, en: label } = CONTENT_TYPE_LABELS[type]
              return (
                <SelectItem key={type} value={type} className={compact ? 'text-xs' : ''}>
                  {ic} {label}
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
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left',
            'ring-offset-background transition-colors',
            'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            compact ? 'h-8 text-xs' : 'h-9 text-sm',
          )}
        >
          <span className={cn('truncate', !selectedItem && 'text-muted-foreground')}>
            {selectedItem
              ? `${icon} ${selectedItem.title}`
              : `Select ${typeLabel.toLowerCase()}...`}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-1">
            {selectedItem && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Clear selection"
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
                placeholder={`Search ${typeLabel.toLowerCase()}...`}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Lista */}
            <div className="max-h-52 overflow-y-auto p-1">
              {isLoading ? (
                <p className="py-3 text-center text-xs text-muted-foreground">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  {search ? 'No results found' : `No ${typeLabel.toLowerCase()}s in catalog`}
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
                    {item.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverImageUrl}
                        alt=""
                        className="size-7 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted text-base">
                        {icon}
                      </span>
                    )}
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
