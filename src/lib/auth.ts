import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días
    updateAge: 60 * 60 * 24, // refrescar si tiene más de 1 día
  },
  user: {
    additionalFields: {
      username: { type: 'string', required: false, unique: true },
      displayName: { type: 'string', required: false },
      bio: { type: 'string', required: false },
    },
  },
})

export type Auth = typeof auth
