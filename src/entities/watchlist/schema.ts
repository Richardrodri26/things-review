// entities/watchlist/schema.ts
import { z } from 'zod'
import { uuidSchema, userIdSchema, contentTypeSchema } from '@/shared/schemas'

export const watchlistPrioritySchema = z.enum(['low', 'medium', 'high'])

export const watchlistItemSchema = z.object({
  id: uuidSchema,
  userId: userIdSchema,
  contentId: z.string().min(1),
  contentType: contentTypeSchema,
  priority: watchlistPrioritySchema,
  note: z.string().max(500).optional(),
  targetDate: z.coerce.date().optional(),
  addedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createWatchlistItemDTOSchema = watchlistItemSchema.omit({
  id: true,
  addedAt: true,
  updatedAt: true,
})

export const updateWatchlistItemDTOSchema = watchlistItemSchema
  .pick({ priority: true, note: true, targetDate: true })
  .partial()
