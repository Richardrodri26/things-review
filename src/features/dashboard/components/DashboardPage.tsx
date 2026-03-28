// src/features/dashboard/components/DashboardPage.tsx
'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { useUser, useStore } from '@/shared/lib/store'
import { QuickStatsSection } from './QuickStatsSection'
import { RecentReviewsSection } from './RecentReviewsSection'
import { CatalogHighlightsSection } from './CatalogHighlightsSection'

export function DashboardPage() {
  const user = useUser()
  const reviews = useStore((s) => s.reviews)
  const [isAddingReview, setIsAddingReview] = useState(false)

  const greeting = user ? `Welcome back, ${user.displayName}` : 'Welcome back'

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {reviews.length === 0
              ? 'Start reviewing your favorite movies and series.'
              : `You have ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} so far.`}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddingReview(true)}>
          <PlusIcon />
          Add Review
        </Button>
      </div>

      {/* Quick Stats — only if there are reviews */}
      {reviews.length > 0 && (
        <QuickStatsSection reviews={reviews} />
      )}

      {/* Catalog Highlights */}
      <CatalogHighlightsSection reviews={reviews} />

      {/* Recent Reviews */}
      <RecentReviewsSection reviews={reviews} />

      {/* Add Review Dialog */}
      <Dialog open={isAddingReview} onOpenChange={(open) => !open && setIsAddingReview(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
          </DialogHeader>
          {isAddingReview && (
            <ReviewForm
              mode="create"
              onSuccess={() => setIsAddingReview(false)}
              onCancel={() => setIsAddingReview(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
