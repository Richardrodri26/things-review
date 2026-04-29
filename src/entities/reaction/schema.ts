import { z } from 'zod'

export const toggleReactionSchema = z.object({
  type: z.enum(['like', 'dislike']),
})
