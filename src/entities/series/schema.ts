// entities/series/schema.ts
import { z } from 'zod'
import { uuidSchema, genreSchema } from '@/shared/schemas'

export const networkSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
})

export const seriesStatusSchema = z.enum([
  'returning_series',
  'ended',
  'canceled',
  'in_production',
  'planned',
])

export const seriesSchema = z.object({
  id: uuidSchema,
  contentType: z.literal('series'),
  providerId: z.string(),
  externalId: z.string().optional(),
  title: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  year: z.number().int().min(1888).max(2100),
  genres: z.array(genreSchema),
  overview: z.string().optional(),
  originalTitle: z.string().optional(),
  firstAirDate: z.string(),
  lastAirDate: z.string().optional(),
  numberOfSeasons: z.number().int().min(0),
  numberOfEpisodes: z.number().int().min(0),
  status: seriesStatusSchema,
  originalLanguage: z.string().length(2),
  adult: z.boolean(),
  backdropImageUrl: z.string().url().optional(),
  networks: z.array(networkSchema).optional(),
  createdAt: z.coerce.date(),
})
