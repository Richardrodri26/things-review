'use client'

// src/features/comments/components/CommentForm.tsx

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUser } from '@/shared/lib/store'
import { useCreateComment } from '../hooks/useComments'

const commentFormSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(500, 'Max 500 characters'),
})

interface CommentFormProps {
  reviewId: string
  groupId: string
  /** Si se pasa, el comentario se crea como reply de este parentId */
  parentId?: string
}

export function CommentForm({ reviewId, groupId, parentId }: CommentFormProps) {
  const user = useUser()
  const tToasts = useTranslations('toasts')
  const createComment = useCreateComment(reviewId, {
    postError: tToasts('comments.postError'),
    postErrorDescription: tToasts('tryAgain'),
  })
  const [focused, setFocused] = useState(false)

  const form = useForm({
    defaultValues: { body: '' },
    validators: { onChange: commentFormSchema },
    onSubmit: async ({ value }) => {
      if (!user) return
      await createComment.mutateAsync({
        reviewId,
        groupId,
        authorId: user.id,
        body: value.body.trim(),
        parentId: parentId ?? null,
      })
      form.reset()
      setFocused(false)
    },
  })

  if (!user) return null

  const displayName = user.displayName ?? user.username
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex gap-3.5"
    >
      {/* Avatar del usuario actual */}
      <Avatar className="size-8 shrink-0 mt-0.5 ring-1 ring-border/50">
        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <form.Field name="body">
          {(field) => (
            <div className="relative">
              <Textarea
                placeholder={parentId ? 'Write a reply…' : 'Leave a comment…'}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={() => {
                  field.handleBlur()
                  if (!field.state.value.trim()) setFocused(false)
                }}
                onFocus={() => setFocused(true)}
                rows={focused ? 3 : 1}
                className="resize-none transition-all duration-150 text-sm"
                maxLength={500}
              />
              {focused && (
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 pointer-events-none">
                  {field.state.value.length}/500
                </span>
              )}
            </div>
          )}
        </form.Field>

        {focused && (
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    form.reset()
                    setFocused(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="xs"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
                </Button>
              </div>
            )}
          </form.Subscribe>
        )}
      </div>
    </form>
  )
}
