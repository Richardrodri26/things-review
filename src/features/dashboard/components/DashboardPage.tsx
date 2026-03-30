// src/features/dashboard/components/DashboardPage.tsx
'use client'

import { useState } from 'react'
import { PlusIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewEditorPage } from '@/features/reviews/components/ReviewEditorPage'
import { useUser, useStore } from '@/shared/lib/store'
import { QuickStatsSection } from './QuickStatsSection'
import { RecentReviewsSection } from './RecentReviewsSection'
import { CatalogHighlightsSection } from './CatalogHighlightsSection'

export function DashboardPage() {
  const user = useUser()
  const reviews = useStore((s) => s.reviews)
  const [isAddingReview, setIsAddingReview] = useState(false)

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Cinematic gradient backdrop */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 50%, oklch(0.488 0.243 264.376) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 90% 20%, oklch(0.623 0.214 259.815) 0%, transparent 60%)',
          }}
        />
        {/* Film-grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative px-6 py-10 sm:px-8 sm:py-14 max-w-4xl">
          {/* Time label */}
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="size-3 opacity-70" />
            {timeGreeting}
          </p>

          {/* Display headline */}
          <h1
            className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {firstName}
            <span className="text-primary">.</span>
          </h1>

          {/* Subtext + CTA row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-sm">
              {reviews.length === 0
                ? 'Your personal review journal. Start tracking what you watch, read, and play.'
                : `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} in your journal.`}
            </p>
            <Button
              size="sm"
              onClick={() => setIsAddingReview(true)}
              className="gap-1.5 shrink-0"
            >
              <PlusIcon className="size-3.5" />
              New Review
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10 p-6 sm:p-8 w-full">
        {reviews.length > 0 && <QuickStatsSection reviews={reviews} />}
        <CatalogHighlightsSection reviews={reviews} />
        <RecentReviewsSection reviews={reviews} />
      </div>

      {/* Full-screen editor */}
      {isAddingReview && (
        <ReviewEditorPage
          mode="create"
          onSuccess={() => setIsAddingReview(false)}
          onCancel={() => setIsAddingReview(false)}
        />
      )}
    </div>
  )
}
