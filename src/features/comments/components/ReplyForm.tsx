'use client'

// src/features/comments/components/ReplyForm.tsx

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/shared/lib/store'
import { useCreateComment } from '../hooks/useComments'

const replySchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty').max(500, 'Max 500 characters'),
})

interface ReplyFormProps {
  reviewId: string
  groupId: string
  parentId: string
  onCancel: () => void
}

export function ReplyForm({ reviewId, groupId, parentId, onCancel }: ReplyFormProps) {
  const user = useUser()
  const createComment = useCreateComment(reviewId)

  const form = useForm({
    defaultValues: { body: '' },
    validators: { onChange: replySchema },
    onSubmit: async ({ value }) => {
      if (!user) return
      await createComment.mutateAsync({
        reviewId,
        groupId,
        authorId: user.id,
        body: value.body.trim(),
        parentId,
      })
      onCancel()
    },
  })

  if (!user) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-2"
    >
      <form.Field name="body">
        {(field) => (
          <div className="relative">
            <Textarea
              placeholder="Write a reply…"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              autoFocus
              maxLength={500}
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
              {field.state.value.length}/500
            </span>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex justify-end gap-2">
            <Button type="button" size="xs" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="xs" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Posting…' : 'Reply'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
