'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RatingStars } from '@/shared/ui/atoms'
import { useUser } from '@/shared/lib/store'
import { useCreateReview, useUpdateReview } from '../hooks'
import type { ReviewFormProps, ReviewFormValues } from '../types'
import type { Rating } from '@/shared/types'

const reviewFormSchema = z.object({
  contentId:        z.string().min(1, 'Content is required'),
  contentType:      z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast']),
  rating:           z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  title:            z.string().max(100).optional(),
  body:             z.string().max(2000).optional(),
  containsSpoilers: z.boolean(),
  status:           z.enum(['consumed', 'want_to_consume', 'consuming', 'dropped']),
})

type ReviewFormData = z.input<typeof reviewFormSchema>

function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  if (typeof error === 'string') return error
  return undefined
}

export function ReviewForm({ mode, initialValues, review, onSuccess, onCancel }: ReviewFormProps) {
  const user = useUser()
  const createReview = useCreateReview()
  const updateReview = useUpdateReview()

  const defaultValues: ReviewFormData = {
    contentId:        initialValues?.contentId ?? review?.contentId ?? '',
    contentType:      initialValues?.contentType ?? review?.contentType ?? 'movie',
    rating:           initialValues?.rating ?? review?.rating,
    title:            initialValues?.title ?? review?.title,
    body:             initialValues?.body ?? review?.body,
    containsSpoilers: initialValues?.containsSpoilers ?? review?.containsSpoilers ?? false,
    status:           initialValues?.status ?? review?.status ?? 'consumed',
  }

  const form = useForm({
    defaultValues,
    validators: {
      onChange: reviewFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return
      const formValues = value as ReviewFormValues

      if (mode === 'create') {
        const result = await createReview.mutateAsync({ ...formValues, userId: user.id })
        onSuccess?.(result)
      } else if (mode === 'edit' && review) {
        const result = await updateReview.mutateAsync({ id: review.id, data: formValues })
        onSuccess?.(result)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* Content ID */}
      <form.Field name="contentId">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Content ID</Label>
            <Input
              id={field.name}
              placeholder="e.g. tt1234567"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Content Type */}
      <form.Field name="contentType">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Type</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as ReviewFormValues['contentType'])}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">🎬 Movie</SelectItem>
                <SelectItem value="series">📺 Series</SelectItem>
                <SelectItem value="music">🎵 Music</SelectItem>
                <SelectItem value="game">🎮 Game</SelectItem>
                <SelectItem value="book">📚 Book</SelectItem>
                <SelectItem value="podcast">🎙️ Podcast</SelectItem>
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Status */}
      <form.Field name="status">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Status</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as ReviewFormValues['status'])}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumed">Consumed</SelectItem>
                <SelectItem value="want_to_consume">Want to consume</SelectItem>
                <SelectItem value="consuming">Currently consuming</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Rating */}
      <form.Field name="rating">
        {(field) => (
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <RatingStars
              value={field.state.value as Rating | undefined}
              onChange={(r: Rating) => field.handleChange(r)}
              size="lg"
            />
          </div>
        )}
      </form.Field>

      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Title <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={field.name}
              placeholder="Give your review a title..."
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Body */}
      <form.Field name="body">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Review <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              placeholder="Write your thoughts..."
              className="resize-none"
              rows={4}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">
                {getErrorMessage(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Review' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
