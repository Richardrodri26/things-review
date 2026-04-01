import { randomInt } from 'node:crypto'

/** Genera un código de invitación de 8 caracteres alfanuméricos */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  // Security: randomInt() uses a CSPRNG — Math.random() is not cryptographically secure
  return Array.from({ length: 8 }, () => chars[randomInt(chars.length)]).join('')
}
