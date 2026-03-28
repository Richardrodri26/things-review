// src/features/catalog/components/AddContentForm.tsx
'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONTENT_TYPE_LABELS } from '@/shared/types'
import { useAddCatalogItem } from '../hooks'
import type { AddItemDTO, CatalogItem } from '@/shared/services'
import type { ContentType } from '@/shared/types'

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const baseSchema = z.object({
  title:         z.string().min(1, 'Title is required'),
  year:          z.coerce.number().int().min(1888).max(2100),
  overview:      z.string().optional(),
  coverImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

const addContentSchema = z.discriminatedUnion('contentType', [
  baseSchema.extend({
    contentType:      z.literal('movie'),
    originalLanguage: z.string().length(2, 'Use 2-letter ISO code'),
    runtime:          z.coerce.number().int().positive().optional(),
    releaseDate:      z.string().min(1, 'Release date is required'),
  }),
  baseSchema.extend({
    contentType:      z.literal('series'),
    originalLanguage: z.string().length(2, 'Use 2-letter ISO code'),
    firstAirDate:     z.string().min(1, 'First air date is required'),
    numberOfSeasons:  z.coerce.number().int().min(1),
    numberOfEpisodes: z.coerce.number().int().min(1),
    status:           z.enum(['returning_series', 'ended', 'canceled', 'in_production', 'planned']),
  }),
  baseSchema.extend({
    contentType:  z.literal('music'),
    artist:       z.string().min(1, 'Artist is required'),
    albumType:    z.enum(['album', 'ep', 'single', 'compilation']),
    totalTracks:  z.coerce.number().int().min(1),
  }),
  baseSchema.extend({
    contentType: z.literal('game'),
    platforms:   z
      .array(z.enum(['pc', 'playstation_5', 'playstation_4', 'xbox_series', 'xbox_one', 'nintendo_switch', 'mobile', 'other']))
      .min(1, 'Select at least one platform'),
    developer:   z.string().optional(),
  }),
  baseSchema.extend({
    contentType: z.literal('book'),
    author:      z.string().min(1, 'Author is required'),
    language:    z.string().length(2, 'Use 2-letter ISO code'),
    pageCount:   z.coerce.number().int().positive().optional(),
  }),
  baseSchema.extend({
    contentType:   z.literal('podcast'),
    host:          z.string().min(1, 'Host is required'),
    language:      z.string().length(2, 'Use 2-letter ISO code'),
    isActive:      z.boolean(),
    totalEpisodes: z.coerce.number().int().positive().optional(),
  }),
])

type AddContentFormData = z.input<typeof addContentSchema>

// ─── DTO transform ───────────────────────────────────────────────────────────

type AnyFormValues = Record<string, unknown>

function toAddItemDTO(values: AnyFormValues): AddItemDTO {
  const cover = (values.coverImageUrl as string)?.trim() || undefined
  const year = Number(values.year)

  switch (values.contentType as ContentType) {
    case 'movie':
      return {
        contentType:      'movie',
        title:            values.title as string,
        year,
        overview:         values.overview as string | undefined,
        coverImageUrl:    cover,
        originalLanguage: values.originalLanguage as string,
        runtime:          values.runtime ? Number(values.runtime) : undefined,
        releaseDate:      values.releaseDate as string,
        adult:            false,
        genres:           [],
      }
    case 'series':
      return {
        contentType:      'series',
        title:            values.title as string,
        year,
        overview:         values.overview as string | undefined,
        coverImageUrl:    cover,
        originalLanguage: values.originalLanguage as string,
        firstAirDate:     values.firstAirDate as string,
        numberOfSeasons:  Number(values.numberOfSeasons),
        numberOfEpisodes: Number(values.numberOfEpisodes),
        status:           values.status as 'returning_series' | 'ended' | 'canceled' | 'in_production' | 'planned',
        adult:            false,
        genres:           [],
      }
    case 'music':
      return {
        contentType:  'music',
        title:        values.title as string,
        year,
        overview:     values.overview as string | undefined,
        coverImageUrl: cover,
        artist:       values.artist as string,
        albumType:    values.albumType as 'album' | 'ep' | 'single' | 'compilation',
        totalTracks:  Number(values.totalTracks),
        genres:       [],
      }
    case 'game':
      return {
        contentType:  'game',
        title:        values.title as string,
        year,
        overview:     values.overview as string | undefined,
        coverImageUrl: cover,
        platforms:    values.platforms as ('pc' | 'playstation_5' | 'playstation_4' | 'xbox_series' | 'xbox_one' | 'nintendo_switch' | 'mobile' | 'other')[],
        developer:    (values.developer as string) || undefined,
        genres:       [],
      }
    case 'book':
      return {
        contentType:  'book',
        title:        values.title as string,
        year,
        overview:     values.overview as string | undefined,
        coverImageUrl: cover,
        author:       (values.author as string).split(',').map((s) => s.trim()).filter(Boolean),
        language:     values.language as string,
        pageCount:    values.pageCount ? Number(values.pageCount) : undefined,
        genres:       [],
      }
    case 'podcast':
      return {
        contentType:   'podcast',
        title:         values.title as string,
        year,
        overview:      values.overview as string | undefined,
        coverImageUrl: cover,
        host:          (values.host as string).split(',').map((s) => s.trim()).filter(Boolean),
        language:      values.language as string,
        isActive:      Boolean(values.isActive),
        totalEpisodes: values.totalEpisodes ? Number(values.totalEpisodes) : undefined,
        genres:        [],
      }
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AddContentFormProps {
  defaultContentType?: ContentType
  onSuccess?: (item: CatalogItem) => void
  onCancel?: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'pc',               label: 'PC' },
  { value: 'playstation_5',    label: 'PS5' },
  { value: 'playstation_4',    label: 'PS4' },
  { value: 'xbox_series',      label: 'Xbox Series' },
  { value: 'xbox_one',         label: 'Xbox One' },
  { value: 'nintendo_switch',  label: 'Nintendo Switch' },
  { value: 'mobile',           label: 'Mobile' },
  { value: 'other',            label: 'Other' },
] as const

// ─── Component ───────────────────────────────────────────────────────────────

export function AddContentForm({
  defaultContentType = 'movie',
  onSuccess,
  onCancel,
}: AddContentFormProps) {
  const addItem = useAddCatalogItem()

  const form = useForm({
    defaultValues: {
      contentType:      defaultContentType,
      title:            '',
      year:             new Date().getFullYear(),
      overview:         '',
      coverImageUrl:    '',
      // movie / series
      originalLanguage: 'en',
      runtime:          undefined as number | undefined,
      releaseDate:      '',
      // series
      firstAirDate:     '',
      numberOfSeasons:  1,
      numberOfEpisodes: 1,
      status:           'returning_series' as const,
      // music
      artist:           '',
      albumType:        'album' as const,
      totalTracks:      1,
      // game
      platforms:        [] as string[],
      developer:        '',
      // book
      author:           '',
      language:         'en',
      pageCount:        undefined as number | undefined,
      // podcast
      host:             '',
      isActive:         true,
      totalEpisodes:    undefined as number | undefined,
    } as AddContentFormData,
    onSubmit: async ({ value }) => {
      const dto = toAddItemDTO(value)
      const result = await addItem.mutateAsync(dto)
      onSuccess?.(result)
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
      {/* ── Content Type ─────────────────────────────────────────────── */}
      <form.Field name="contentType">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Type</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as ContentType)}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CONTENT_TYPE_LABELS) as [
                    ContentType,
                    { en: string; icon: string },
                  ][]
                ).map(([type, { en, icon }]) => (
                  <SelectItem key={type} value={type}>
                    {icon} {en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* ── Title ────────────────────────────────────────────────────── */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Title *</Label>
            <Input
              id={field.name}
              placeholder="e.g. Inception"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* ── Year ─────────────────────────────────────────────────────── */}
      <form.Field name="year">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Year *</Label>
            <Input
              id={field.name}
              type="number"
              min={1888}
              max={2100}
              value={String(field.state.value ?? '')}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* ── Overview ─────────────────────────────────────────────────── */}
      <form.Field name="overview">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Overview <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={field.name}
              placeholder="Short description..."
              rows={3}
              className="resize-none"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      {/* ── Cover Image URL ───────────────────────────────────────────── */}
      <form.Field name="coverImageUrl">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>
              Cover Image URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={field.name}
              type="url"
              placeholder="https://..."
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* ── Type-specific fields ──────────────────────────────────────── */}
      <form.Subscribe selector={(s) => s.values.contentType}>
        {(contentType) => (
          <>
            {/* MOVIE */}
            {contentType === 'movie' && (
              <>
                <form.Field name="releaseDate">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Release Date *</Label>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="originalLanguage">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Language *</Label>
                        <Input
                          id={field.name}
                          placeholder="en"
                          maxLength={2}
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                          onBlur={field.handleBlur}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="runtime">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>
                          Runtime (min) <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* SERIES */}
            {contentType === 'series' && (
              <>
                <form.Field name="firstAirDate">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>First Air Date *</Label>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <form.Field name="originalLanguage">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Language *</Label>
                      <Input
                        id={field.name}
                        placeholder="en"
                        maxLength={2}
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                   <form.Field name="numberOfSeasons">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Seasons *</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="numberOfEpisodes">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Episodes *</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
                <form.Field name="status">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Status *</Label>
                      <Select
                        value={field.state.value ?? ''}
                        onValueChange={(v) =>
                          field.handleChange(
                            v as 'returning_series' | 'ended' | 'canceled' | 'in_production' | 'planned',
                          )
                        }
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="returning_series">Returning Series</SelectItem>
                          <SelectItem value="ended">Ended</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </>
            )}

            {/* MUSIC */}
            {contentType === 'music' && (
              <>
                <form.Field name="artist">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Artist *</Label>
                      <Input
                        id={field.name}
                        placeholder="e.g. Radiohead"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="albumType">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Type *</Label>
                        <Select
                          value={field.state.value ?? 'album'}
                          onValueChange={(v) =>
                            field.handleChange(v as 'album' | 'ep' | 'single' | 'compilation')
                          }
                        >
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="album">Album</SelectItem>
                            <SelectItem value="ep">EP</SelectItem>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="compilation">Compilation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="totalTracks">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Tracks *</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* GAME */}
            {contentType === 'game' && (
              <>
                <form.Field name="developer">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>
                        Developer <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id={field.name}
                        placeholder="e.g. FromSoftware"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="platforms">
                  {(field) => {
                    type GamePlatformValue = 'pc' | 'playstation_5' | 'playstation_4' | 'xbox_series' | 'xbox_one' | 'nintendo_switch' | 'mobile' | 'other'
                    const current = (field.state.value ?? []) as GamePlatformValue[]
                    return (
                      <div className="space-y-1.5">
                        <Label>Platforms *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map((p) => (
                            <div key={p.value} className="flex items-center gap-2">
                              <Checkbox
                                id={`platform-${p.value}`}
                                checked={current.includes(p.value)}
                                onCheckedChange={(checked) => {
                                  field.handleChange(
                                    checked
                                      ? [...current, p.value]
                                      : current.filter((v) => v !== p.value),
                                  )
                                }}
                              />
                              <label
                                htmlFor={`platform-${p.value}`}
                                className="text-sm cursor-pointer"
                              >
                                {p.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )
                  }}
                </form.Field>
              </>
            )}

            {/* BOOK */}
            {contentType === 'book' && (
              <>
                <form.Field name="author">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>
                        Author(s) *{' '}
                        <span className="text-muted-foreground text-xs">(comma-separated)</span>
                      </Label>
                      <Input
                        id={field.name}
                        placeholder="e.g. Frank Herbert"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="language">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Language *</Label>
                        <Input
                          id={field.name}
                          placeholder="en"
                          maxLength={2}
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                          onBlur={field.handleBlur}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="pageCount">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>
                          Pages <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </>
            )}

            {/* PODCAST */}
            {contentType === 'podcast' && (
              <>
                <form.Field name="host">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>
                        Host(s) *{' '}
                        <span className="text-muted-foreground text-xs">(comma-separated)</span>
                      </Label>
                      <Input
                        id={field.name}
                        placeholder="e.g. Lex Fridman"
                        value={field.state.value ?? ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="language">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>Language *</Label>
                        <Input
                          id={field.name}
                          placeholder="en"
                          maxLength={2}
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                          onBlur={field.handleBlur}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="totalEpisodes">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>
                          Episodes <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id={field.name}
                          type="number"
                          min={1}
                          value={String(field.state.value ?? '')}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
                <form.Field name="isActive">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isActive"
                        checked={field.state.value ?? true}
                        onCheckedChange={(v) => field.handleChange(Boolean(v))}
                      />
                      <label htmlFor="isActive" className="text-sm cursor-pointer">
                        Still publishing episodes
                      </label>
                    </div>
                  )}
                </form.Field>
              </>
            )}
          </>
        )}
      </form.Subscribe>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add to Catalog'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
