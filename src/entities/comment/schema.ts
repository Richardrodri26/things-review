// entities/comment/schema.ts
import { z } from 'zod'
import { uuidSchema } from '@/shared/schemas'

export const commentSchema = z.object({
  id: uuidSchema,
  reviewId: uuidSchema,
  groupId: uuidSchema,
  authorId: uuidSchema,
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
