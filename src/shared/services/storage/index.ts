// src/shared/services/storage/index.ts
import type { IStorageProvider } from './types'
import { CloudinaryStorageProvider } from './providers/cloudinary'
import { LocalStorageProvider } from './providers/local'

// Bootstrap: elige el proveedor activo según las env vars disponibles.
// Agregar un nuevo proveedor = crear nueva clase + cambiar este bloque.
function createStorageProvider(): IStorageProvider {
  if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return new CloudinaryStorageProvider()
  }
  return new LocalStorageProvider()
}

/**
 * El proveedor de storage activo.
 * Los consumers importan esto directamente — no saben nada del proveedor concreto.
 *
 * @example
 * import { storageProvider } from '@/shared/services/storage'
 * const result = await storageProvider.uploadFile(file, 'reviews')
 */
export const storageProvider: IStorageProvider = createStorageProvider()

// Re-exports para usar los tipos donde se necesiten
export type { IStorageProvider, StorageUploadResult } from './types'
