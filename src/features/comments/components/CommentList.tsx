'use client'

// src/features/comments/components/CommentList.tsx

import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/shared/lib/store'
import { useComments } from '../hooks/useComments'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'

interface CommentListProps {
  reviewId: string
  groupId: string
}

export function CommentList({ reviewId, groupId }: CommentListProps) {
  const user = useUser()
  const { data: threads, isLoading } = useComments(reviewId)
  const count = threads?.length ?? 0

  return (
    <section className="space-y-8" aria-label="Discussion">
      {/* Write new comment */}
      <CommentForm reviewId={reviewId} groupId={groupId} />

      {/* Existing comments */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3.5">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : count > 0 ? (
        <div className="space-y-6">
          {threads!.map((thread) => (
            <CommentCard
              key={thread.id}
              comment={thread}
              isOwn={thread.authorId === user?.id}
              replies={thread.replies}
              depth={0}
              reviewId={reviewId}
              groupId={groupId}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50 text-center py-10">
          No comments yet. Start the discussion.
        </p>
      )}
    </section>
  )
}
