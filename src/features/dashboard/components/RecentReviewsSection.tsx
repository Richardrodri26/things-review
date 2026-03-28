// src/features/dashboard/components/RecentReviewsSection.tsx
import Link from 'next/link'
import { StarIcon, ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/shared/ui/atoms'
import { ReviewCard } from '@/features/reviews/components/ReviewCard'
import { ROUTES } from '@/shared/constants'
import { cn } from '@/lib/utils'
import type { Review } from '@/entities/review/types'

interface RecentReviewsSectionProps {
  reviews: Review[]
}

const MAX_RECENT = 3

export function RecentReviewsSection({ reviews }: RecentReviewsSectionProps) {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const recent = sorted.slice(0, MAX_RECENT)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent Reviews
        </h2>
        {reviews.length > 0 && (
          <Link
            href={ROUTES.REVIEWS}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
          >
            See all
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon className="size-6" />}
          title="No reviews yet"
          description="Start reviewing movies and series from the catalog."
          action={
            <Link
              href={ROUTES.MOVIES}
              className={buttonVariants({ size: 'sm' })}
            >
              Browse Movies
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  )
}
