'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  BookmarkIcon,
  PlusIcon,
  TrendingUpIcon,
  XIcon,
  ArrowDownUpIcon,
  FilterIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ContentType } from '@/shared/types'
import type { WatchlistItem, WatchlistPriority } from '@/entities/watchlist/types'
import { WatchlistCard } from './WatchlistCard'
import { WatchlistForm } from './WatchlistForm'
import { WatchlistStatsBar } from './WatchlistStatsBar'
import {
  useWatchlistItems,
  useWatchlistStats,
  useRemoveFromWatchlist,
  useConvertWatchlistItemToReview,
} from '../hooks'

type UIMode =
  | { type: 'idle' }
  | { type: 'add' }
  | { type: 'edit'; item: WatchlistItem; title: string }
  | { type: 'remove'; item: WatchlistItem; title: string }
  | { type: 'consume'; item: WatchlistItem; title: string }

type SortOption = 'priority' | 'date_added' | 'target_date'
type FilterContentType = ContentType | 'all'
type FilterPriority = WatchlistPriority | 'all'

export function WatchlistPage() {
  const t = useTranslations('watchlist')
  const tCommon = useTranslations('common')
  const tToasts = useTranslations('toasts')
  const { data: items = [], isLoading } = useWatchlistItems()
  const { data: stats } = useWatchlistStats()
  const removeItem = useRemoveFromWatchlist({
    removed: tToasts('watchlist.removed'),
    removedError: tToasts('watchlist.removedError'),
    removedErrorDescription: tToasts('tryAgain'),
  })
  const convertToReview = useConvertWatchlistItemToReview({
    consumed: tToasts('watchlist.consumed'),
    consumedDescription: tToasts('watchlist.consumedDescription'),
    consumedError: tToasts('watchlist.consumedError'),
    consumedErrorDescription: tToasts('tryAgain'),
  })

  const [mode, setMode] = useState<UIMode>({ type: 'idle' })
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [filterType, setFilterType] = useState<FilterContentType>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')

  const isFormOpen = mode.type === 'add' || mode.type === 'edit'

  const processedItems = useMemo(() => {
    let result = [...items]

    if (filterType !== 'all') {
      result = result.filter((i) => i.contentType === filterType)
    }
    if (filterPriority !== 'all') {
      result = result.filter((i) => i.priority === filterPriority)
    }

    if (sortBy === 'priority') {
      const order: Record<WatchlistPriority, number> = { high: 0, medium: 1, low: 2 }
      result.sort((a, b) => order[a.priority] - order[b.priority])
    } else if (sortBy === 'date_added') {
      result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    } else if (sortBy === 'target_date') {
      result.sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0
        if (!a.targetDate) return 1
        if (!b.targetDate) return -1
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      })
    }

    return result
  }, [items, filterType, filterPriority, sortBy])

  async function confirmRemove() {
    if (mode.type !== 'remove') return
    await removeItem.mutateAsync(mode.item.id)
    setMode({ type: 'idle' })
  }

  async function confirmConsume() {
    if (mode.type !== 'consume') return
    await convertToReview.mutateAsync({
      watchlistItemId: mode.item.id,
      contentId: mode.item.contentId,
      contentType: mode.item.contentType,
    })
    setMode({ type: 'idle' })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('count', { count: items.length })}
            </p>
          )}
        </div>
        <Button onClick={() => setMode({ type: 'add' })} size="sm">
          <PlusIcon data-icon="inline-start" />
          {t('addItem')}
        </Button>
      </div>

      {/* Stats Bar */}
      {stats && stats.total > 0 && <WatchlistStatsBar stats={stats} />}

      {/* Filters + Sort — solo si hay items */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowDownUpIcon className="size-3.5 text-muted-foreground" />
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[sortBy]}
              onValueChange={(vals) => {
                if (vals.length > 0) setSortBy(vals[vals.length - 1] as SortOption)
              }}
            >
              <ToggleGroupItem value="priority">{t('sort.priority')}</ToggleGroupItem>
              <ToggleGroupItem value="date_added">{t('sort.dateAdded')}</ToggleGroupItem>
              <ToggleGroupItem value="target_date">{t('sort.targetDate')}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Filter by priority */}
          <div className="flex items-center gap-2">
            <FilterIcon className="size-3.5 text-muted-foreground" />
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[filterPriority]}
              onValueChange={(vals) => {
                if (vals.length > 0) setFilterPriority(vals[vals.length - 1] as FilterPriority)
              }}
            >
              <ToggleGroupItem value="all">{t('filter.all')}</ToggleGroupItem>
              <ToggleGroupItem value="high">{t('filter.high')}</ToggleGroupItem>
              <ToggleGroupItem value="medium">{t('filter.medium')}</ToggleGroupItem>
              <ToggleGroupItem value="low">{t('filter.low')}</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookmarkIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty')}</EmptyTitle>
            <EmptyDescription>
              {t('emptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setMode({ type: 'add' })} size="sm">
              <PlusIcon data-icon="inline-start" />
              {t('emptyAction')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : processedItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUpIcon />
            </EmptyMedia>
            <EmptyTitle>{tCommon('noResults')}</EmptyTitle>
            <EmptyDescription>
              {tCommon('clearFilters')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterType('all')
                setFilterPriority('all')
              }}
            >
              <XIcon data-icon="inline-start" />
              {tCommon('clearFilters')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {processedItems.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onEdit={(i, title) => setMode({ type: 'edit', item: i, title })}
              onRemove={(i, title) => setMode({ type: 'remove', item: i, title })}
              onMarkAsConsumed={(i, title) => setMode({ type: 'consume', item: i, title })}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setMode({ type: 'idle' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode.type === 'add' ? t('addItem') : tCommon('edit')}
            </DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <WatchlistForm
              mode={mode.type === 'add' ? 'add' : 'edit'}
              item={mode.type === 'edit' ? mode.item : undefined}
              onSuccess={() => setMode({ type: 'idle' })}
              onCancel={() => setMode({ type: 'idle' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation — AlertDialog para acciones destructivas */}
      <AlertDialog
        open={mode.type === 'remove'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {mode.type === 'remove'
                ? t('removeDialog.description', { title: mode.title })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMode({ type: 'idle' })}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmRemove}
              disabled={removeItem.isPending}
            >
              {removeItem.isPending && <Spinner data-icon="inline-start" />}
              {t('removeDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consume Confirmation — AlertDialog */}
      <AlertDialog
        open={mode.type === 'consume'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('consumeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {mode.type === 'consume'
                ? t('consumeDialog.description', { title: mode.title })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMode({ type: 'idle' })}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConsume}
              disabled={convertToReview.isPending}
            >
              {convertToReview.isPending && <Spinner data-icon="inline-start" />}
              {t('consumeDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
