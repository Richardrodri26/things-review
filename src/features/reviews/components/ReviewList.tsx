// src/features/reviews/components/ReviewList.tsx
'use client'

import { useState, useMemo } from 'react'
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
import { ReviewForm } from './ReviewForm'
import { ReviewFilters } from './ReviewFilters'
import { useReviews, useDeleteReview } from '../hooks'
import type { Review } from '@/entities/review/types'

type UIMode =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; review: Review }
  | { type: 'delete'; review: Review }

export function ReviewList() {
  const { data: reviews = [], isLoading } = useReviews()
  const deleteReview = useDeleteReview()
  const [mode, setMode] = useState<UIMode>({ type: 'idle' })

  // Filter state — local UI state, no store
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<ConsumptionStatus[]>([])

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
    setSelectedContentTypes((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    )
  }

  function toggleStatus(status: ConsumptionStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  function clearFilters() {
    setSelectedContentTypes([])
    setSelectedStatuses([])
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
        <h1 className="text-xl font-semibold">My Reviews</h1>
        <Button onClick={() => setMode({ type: 'create' })} size="sm">
          <PlusIcon />
          Add Review
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews yet"
          description="Start by adding your first review."
          action={
            <Button onClick={() => setMode({ type: 'create' })} size="sm">
              <PlusIcon />
              Add your first review
            </Button>
          }
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews match your filters"
          description="Try adjusting or clearing the filters."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Create / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setMode({ type: 'idle' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode.type === 'create' ? 'Add Review' : 'Edit Review'}
            </DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <ReviewForm
              mode={mode.type === 'create' ? 'create' : 'edit'}
              review={mode.type === 'edit' ? mode.review : undefined}
              onSuccess={() => setMode({ type: 'idle' })}
              onCancel={() => setMode({ type: 'idle' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={mode.type === 'delete'}
        onOpenChange={(open) => !open && setMode({ type: 'idle' })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The review will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode({ type: 'idle' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
