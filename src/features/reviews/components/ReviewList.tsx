// src/features/reviews/components/ReviewList.tsx
'use client'

import { useState, useMemo } from 'react'
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
import { useTranslations } from 'next-intl'
import { PlusIcon, StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/shared/ui/atoms'
import type { ContentType, ConsumptionStatus } from '@/shared/types'
import { ReviewCard } from './ReviewCard'
import { ReviewEditorPage } from './ReviewEditorPage'
import { ReviewFilters } from './ReviewFilters'
import { useReviews, useDeleteReview } from '../hooks'
import type { Review } from '@/entities/review/types'

type UIMode =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; review: Review }
  | { type: 'delete'; review: Review }

export function ReviewList() {
  const t = useTranslations('reviews')
  const tCommon = useTranslations('common')
  const { data: reviews = [], isLoading } = useReviews()
  const deleteReview = useDeleteReview()
  const [mode, setMode] = useState<UIMode>({ type: 'idle' })

  // Filter state — URL-persisted via nuqs
  const [selectedContentTypesRaw, setSelectedContentTypes] = useQueryState(
    'types',
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [selectedStatusesRaw, setSelectedStatuses] = useQueryState(
    'statuses',
    parseAsArrayOf(parseAsString).withDefault([])
  )

  // Cast string[] to typed arrays
  const selectedContentTypes = selectedContentTypesRaw as ContentType[]
  const selectedStatuses = selectedStatusesRaw as ConsumptionStatus[]

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesType = selectedContentTypes.length === 0
        || selectedContentTypes.includes(review.contentType)
      const matchesStatus = selectedStatuses.length === 0
        || selectedStatuses.includes(review.status)
      return matchesType && matchesStatus
    })
  }, [reviews, selectedContentTypes, selectedStatuses])

  function toggleContentType(ct: ContentType) {
    setSelectedContentTypes((prev) => {
      const typed = prev as ContentType[]
      return typed.includes(ct) ? typed.filter((c) => c !== ct) : [...typed, ct]
    })
  }

  function toggleStatus(status: ConsumptionStatus) {
    setSelectedStatuses((prev) => {
      const typed = prev as ConsumptionStatus[]
      return typed.includes(status) ? typed.filter((s) => s !== status) : [...typed, status]
    })
  }

  function clearFilters() {
    setSelectedContentTypes(null)
    setSelectedStatuses(null)
  }

  function handleEdit(review: Review) {
    setMode({ type: 'edit', review })
  }

  function handleDelete(review: Review) {
    setMode({ type: 'delete', review })
  }

  async function confirmDelete() {
    if (mode.type !== 'delete') return
    await deleteReview.mutateAsync(mode.review.id)
    setMode({ type: 'idle' })
  }

  const isFormOpen = mode.type === 'create' || mode.type === 'edit'

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setMode({ type: 'create' })} size="sm">
          <PlusIcon />
          {t('addReview')}
        </Button>
      </div>

      {/* Filters — only show if there's something to filter */}
      {reviews.length > 0 && (
        <ReviewFilters
          selectedContentTypes={selectedContentTypes}
          selectedStatuses={selectedStatuses}
          onContentTypeToggle={toggleContentType}
          onStatusToggle={toggleStatus}
          onClearAll={clearFilters}
          totalResults={filteredReviews.length}
          totalReviews={reviews.length}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(180px,220px))]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title={t('empty')}
          description={t('emptyDescription')}
          action={
            <Button onClick={() => setMode({ type: 'create' })} size="sm">
              <PlusIcon />
              {t('emptyAction')}
            </Button>
          }
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title={t('noMatch')}
          description={t('noMatchDescription')}
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {tCommon('clearFilters')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(180px,220px))]">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit — full-screen Notion-like editor */}
      {isFormOpen && (
        <ReviewEditorPage
          mode={mode.type === 'create' ? 'create' : 'edit'}
          review={mode.type === 'edit' ? mode.review : undefined}
          onSuccess={() => setMode({ type: 'idle' })}
          onCancel={() => setMode({ type: 'idle' })}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={mode.type === 'delete'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode({ type: 'idle' })}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? tCommon('deleting') : t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
