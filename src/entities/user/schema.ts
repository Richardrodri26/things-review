// entities/user/schema.ts
import { z } from 'zod'
import { uuidSchema } from '@/shared/schemas'

export const userSchema = z.object({
  id: uuidSchema,
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createUserDTOSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateUserDTOSchema = userSchema
  .pick({ displayName: true, avatarUrl: true, bio: true })
  .partial()
