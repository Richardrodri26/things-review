// src/shared/services/storage/providers/cloudinary.ts
import type { IStorageProvider, StorageUploadResult } from '../types'

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  format: string
  width?: number
  height?: number
  bytes: number
  error?: { message: string }
}

export class CloudinaryStorageProvider implements IStorageProvider {
  readonly id = 'cloudinary'
  readonly displayName = 'Cloudinary'

  private readonly cloudName: string
  private readonly uploadPreset: string
  private readonly baseFolder: string
  private readonly uploadUrl: string

  constructor(cloudName?: string, uploadPreset?: string, baseFolder?: string) {
    this.cloudName = (cloudName ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '').trim()
    this.uploadPreset = (uploadPreset ?? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '').trim()
    this.baseFolder = (baseFolder ?? process.env.NEXT_PUBLIC_CLOUDINARY_BASE_FOLDER ?? '').trim()
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`
  }

  private resolveFolder(folder?: string): string | undefined {
    if (this.baseFolder && folder) return `${this.baseFolder}/${folder}`
    if (this.baseFolder) return this.baseFolder
    return folder
  }

  async uploadFile(file: File, folder?: string): Promise<StorageUploadResult> {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', this.uploadPreset)
    const resolved = this.resolveFolder(folder)
    if (resolved) form.append('folder', resolved)

    return this.doUpload(form)
  }

  async uploadByUrl(url: string, folder?: string): Promise<StorageUploadResult> {
    const form = new FormData()
    form.append('file', url)
    form.append('upload_preset', this.uploadPreset)
    const resolved = this.resolveFolder(folder)
    if (resolved) form.append('folder', resolved)

    return this.doUpload(form)
  }

  private async doUpload(form: FormData): Promise<StorageUploadResult> {
    const res = await fetch(this.uploadUrl, { method: 'POST', body: form })

    if (!res.ok) {
      throw new Error(`[Cloudinary] Upload failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as CloudinaryUploadResponse

    if (data.error) {
      throw new Error(`[Cloudinary] ${data.error.message}`)
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    }
  }
}
