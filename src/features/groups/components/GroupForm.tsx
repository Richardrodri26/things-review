// src/features/groups/components/GroupForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import type { ContentType } from '@/shared/types'
import { useCreateGroup } from '../hooks'

const CONTENT_TYPE_LIST: ContentType[] = ['movie', 'series', 'music', 'game', 'book', 'podcast']

const groupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
  visibility: z.enum(['public', 'private']),
  focusContentTypes: z.array(z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast'])).optional(),
})

type FormData = z.input<typeof groupSchema>

function getError(errors: unknown[]): string | undefined {
  const e = errors[0]
  if (!e) return undefined
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return undefined
}

interface GroupFormProps {
  onSuccess?: (groupId: string) => void
  onCancel?: () => void
}

export function GroupForm({ onSuccess, onCancel }: GroupFormProps) {
  const createGroup = useCreateGroup()

  const defaultValues: FormData = {
    name: '',
    description: '',
    visibility: 'public',
    focusContentTypes: [],
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: groupSchema },
    onSubmit: async ({ value }) => {
      const group = await createGroup.mutateAsync({
        name: value.name,
        description: value.description || undefined,
        visibility: value.visibility,
        focusContentTypes: value.focusContentTypes?.length ? value.focusContentTypes : undefined,
        ownerId: '', // se sobreescribe en el servicio con el userId real
      })
      onSuccess?.(group.id)
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
      {/* Name */}
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Group Name</Label>
            <Input
              id={field.name}
              placeholder="e.g. Weekend Movie Club"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoFocus
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              placeholder="What's this group about?"
              className="resize-none"
              rows={2}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && (
              <p className="text-xs text-destructive">{getError(field.state.meta.errors)}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Visibility */}
      <form.Field name="visibility">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Visibility</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as 'public' | 'private')}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">🌍 Public</SelectItem>
                <SelectItem value="private">🔒 Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* Focus Content Types */}
      <form.Field name="focusContentTypes">
        {(field) => (
          <div className="space-y-2">
            <Label>
              Focus Types <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONTENT_TYPE_LIST.map((ct) => {
                const label = CONTENT_TYPE_LABELS[ct]
                const checked = (field.state.value ?? []).includes(ct)
                return (
                  <label
                    key={ct}
                    className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const current = field.state.value ?? []
                        field.handleChange(
                          v ? [...current, ct] : current.filter((c) => c !== ct)
                        )
                      }}
                    />
                    <span className="text-sm">
                      {label.icon} {label.en}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
