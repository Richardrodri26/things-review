// entities/review/schema.ts
import { z } from 'zod'
import { uuidSchema, ratingSchema, consumptionStatusSchema, contentTypeSchema } from '@/shared/schemas'

export const gamePlatformSchema = z.enum([
  'pc', 'playstation_5', 'playstation_4', 'xbox_series',
  'xbox_one', 'nintendo_switch', 'mobile', 'other',
])

export const seriesReviewMetadataSchema = z.object({
  contentType: z.literal('series'),
  currentSeason: z.number().int().positive().optional(),
  currentEpisode: z.number().int().positive().optional(),
  seasonRatings: z.record(z.coerce.string(), ratingSchema).optional(),
})

export const gameReviewMetadataSchema = z.object({
  contentType: z.literal('game'),
  platform: gamePlatformSchema.optional(),
  hoursPlayed: z.number().min(0).optional(),
  completionPercent: z.number().min(0).max(100).optional(),
  difficulty: z.enum(['easy', 'normal', 'hard', 'very_hard']).optional(),
})

export const bookReviewMetadataSchema = z.object({
  contentType: z.literal('book'),
  currentPage: z.number().int().positive().optional(),
  readingFormat: z.enum(['physical', 'ebook', 'audiobook']).optional(),
})

export const podcastReviewMetadataSchema = z.object({
  contentType: z.literal('podcast'),
  episodesListened: z.number().int().min(0).optional(),
})

export const reviewMetadataSchema = z.union([
  seriesReviewMetadataSchema,
  gameReviewMetadataSchema,
  bookReviewMetadataSchema,
  podcastReviewMetadataSchema,
]).nullable().optional()

// EditorJS OutputData schema — guardamos el JSON completo
const editorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
})

const editorOutputSchema = z.object({
  time: z.number().optional(),
  version: z.string().optional(),
  blocks: z.array(editorBlockSchema),
}).optional()

export const reviewSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  contentId: z.string(),
  contentType: contentTypeSchema,
  rating: ratingSchema.optional(),
  title: z.string().max(100).optional(),
  body: editorOutputSchema,
  containsSpoilers: z.boolean(),
  status: consumptionStatusSchema,
  metadata: reviewMetadataSchema,
  consumedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createReviewDTOSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateReviewDTOSchema = reviewSchema
  .pick({
    rating: true,
    title: true,
    body: true,
    containsSpoilers: true,
    status: true,
    consumedAt: true,
    metadata: true,
  })
  .partial()
