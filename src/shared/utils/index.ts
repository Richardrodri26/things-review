// shared/utils/index.ts
export { cn } from './cn'

/**
 * Formatea una fecha a string legible
 */
export function formatDate(date: Date | string, locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Genera un UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Genera un código de invitación de 8 caracteres alfanuméricos
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

/**
 * Calcula el promedio de un array de números
 */
export function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
