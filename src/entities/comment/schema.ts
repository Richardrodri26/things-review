// entities/comment/schema.ts
import { z } from 'zod'
import { uuidSchema, userIdSchema } from '@/shared/schemas'

export const commentSchema = z.object({
  id: uuidSchema,
  reviewId: uuidSchema,
  groupId: z.string().nullable(),
  authorId: userIdSchema,
  body: z.string().min(1).max(500),
  parentId: uuidSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createCommentDTOSchema = commentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateCommentDTOSchema = commentSchema.pick({ body: true })
