// shared/schemas/index.ts
import { z } from 'zod'

// UUID genérico — reutilizable en todos los schemas
export const uuidSchema = z.string().uuid()

// Date como string ISO — para localStorage y forms
export const isoDateSchema = z.string().datetime()

// ContentType schema
export const contentTypeSchema = z.enum(['movie', 'series', 'music', 'game', 'book', 'podcast'])

// Rating 1-5
export const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

// ConsumptionStatus
export const consumptionStatusSchema = z.enum([
  'consumed',
  'want_to_consume',
  'consuming',
  'dropped',
])

// GroupVisibility
export const groupVisibilitySchema = z.enum(['public', 'private'])

// GroupRole
export const groupRoleSchema = z.enum(['owner', 'admin', 'member'])

// Genre schema
export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEs: z.string().optional(),
  applicableTo: z.array(contentTypeSchema),
})
