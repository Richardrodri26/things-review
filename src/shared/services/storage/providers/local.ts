// src/shared/services/storage/providers/local.ts
import type { IStorageProvider, StorageUploadResult } from '../types'

export class LocalStorageProvider implements IStorageProvider {
  readonly id = 'local'
  readonly displayName = 'Local (dev only — blob URLs)'

  async uploadFile(file: File, _folder?: string): Promise<StorageUploadResult> {
    const url = URL.createObjectURL(file)
    return {
      url,
      publicId: `local/${file.name}`,
      format: file.type.split('/')[1] ?? 'bin',
      bytes: file.size,
    }
  }

  async uploadByUrl(url: string, _folder?: string): Promise<StorageUploadResult> {
    // En modo local, devolvemos la URL tal cual — no hay upload real
    return {
      url,
      publicId: `local/external`,
      format: 'unknown',
      bytes: 0,
    }
  }
}
