// shared/services/localStorage.service.ts

/**
 * Helper genérico para leer/escribir en localStorage con serialización segura.
 * Todos los servicios usan esto internamente.
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error(`[Storage] Failed to write key: ${key}`)
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
