// entities/group/schema.ts
import { z } from 'zod'
import { uuidSchema, userIdSchema, groupVisibilitySchema, contentTypeSchema } from '@/shared/schemas'

export const groupSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
  visibility: groupVisibilitySchema,
  inviteCode: z.string().length(8),
  ownerId: userIdSchema,
  memberIds: z.array(userIdSchema),
  focusContentTypes: z.array(contentTypeSchema).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createGroupDTOSchema = groupSchema.omit({
  id: true,
  inviteCode: true,
  memberIds: true,
  createdAt: true,
  updatedAt: true,
})

export const updateGroupDTOSchema = groupSchema
  .pick({ name: true, description: true, avatarUrl: true, visibility: true, focusContentTypes: true })
  .partial()
