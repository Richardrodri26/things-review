'use client'

import { useState, useMemo } from 'react'
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
  | { type: 'edit'; item: WatchlistItem }
  | { type: 'remove'; item: WatchlistItem }
  | { type: 'consume'; item: WatchlistItem }

type SortOption = 'priority' | 'date_added' | 'target_date'
type FilterContentType = ContentType | 'all'
type FilterPriority = WatchlistPriority | 'all'

export function WatchlistPage() {
  const { data: items = [], isLoading } = useWatchlistItems()
  const { data: stats } = useWatchlistStats()
  const removeItem = useRemoveFromWatchlist()
  const convertToReview = useConvertWatchlistItemToReview()

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
          <h1 className="text-xl font-semibold">Watchlist</h1>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} to consume
            </p>
          )}
        </div>
        <Button onClick={() => setMode({ type: 'add' })} size="sm">
          <PlusIcon data-icon="inline-start" />
          Add Item
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
              <ToggleGroupItem value="priority">Priority</ToggleGroupItem>
              <ToggleGroupItem value="date_added">Date Added</ToggleGroupItem>
              <ToggleGroupItem value="target_date">Target Date</ToggleGroupItem>
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
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="high">High</ToggleGroupItem>
              <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
              <ToggleGroupItem value="low">Low</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookmarkIcon />
            </EmptyMedia>
            <EmptyTitle>Your watchlist is empty</EmptyTitle>
            <EmptyDescription>
              Add movies, series, books and more that you want to consume.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setMode({ type: 'add' })} size="sm">
              <PlusIcon data-icon="inline-start" />
              Add your first item
            </Button>
          </EmptyContent>
        </Empty>
      ) : processedItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUpIcon />
            </EmptyMedia>
            <EmptyTitle>No items match your filters</EmptyTitle>
            <EmptyDescription>
              Try changing or clearing the active filters.
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
              Clear Filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {processedItems.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onEdit={(i) => setMode({ type: 'edit', item: i })}
              onRemove={(i) => setMode({ type: 'remove', item: i })}
              onMarkAsConsumed={(i) => setMode({ type: 'consume', item: i })}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setMode({ type: 'idle' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode.type === 'add' ? 'Add to Watchlist' : 'Edit Watchlist Item'}
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
            <AlertDialogTitle>Remove from Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be removed from your watchlist. You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMode({ type: 'idle' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmRemove}
              disabled={removeItem.isPending}
            >
              {removeItem.isPending && <Spinner data-icon="inline-start" />}
              Remove
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
            <AlertDialogTitle>Mark as Consumed</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the item from your watchlist and create a basic review for it.
              You can edit the review afterwards to add your rating and thoughts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMode({ type: 'idle' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConsume}
              disabled={convertToReview.isPending}
            >
              {convertToReview.isPending && <Spinner data-icon="inline-start" />}
              Yes, I&apos;ve consumed it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
