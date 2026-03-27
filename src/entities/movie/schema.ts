// entities/movie/schema.ts
import { z } from 'zod'
import { uuidSchema, genreSchema } from '@/shared/schemas'

export const movieSchema = z.object({
  id: uuidSchema,
  contentType: z.literal('movie'),
  providerId: z.string(),
  externalId: z.string().optional(),
  title: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  year: z.number().int().min(1888).max(2100),
  genres: z.array(genreSchema),
  overview: z.string().optional(),
  originalTitle: z.string().optional(),
  runtime: z.number().int().positive().optional(),
  originalLanguage: z.string().length(2),
  adult: z.boolean(),
  backdropImageUrl: z.string().url().optional(),
  releaseDate: z.string(),
  createdAt: z.coerce.date(),
})
