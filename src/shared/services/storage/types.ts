// src/shared/services/storage/types.ts

export interface StorageUploadResult {
  /** URL pública accesible — usar esta para mostrar en el editor/UI */
  url: string
  /** ID del archivo en el proveedor — guardar si se necesita delete después */
  publicId: string
  format: string
  width?: number
  height?: number
  bytes: number
}

export interface IStorageProvider {
  readonly id: string
  readonly displayName: string

  /**
   * Sube un archivo (File API) al proveedor.
   * @param file  El archivo a subir
   * @param folder  Carpeta opcional dentro del bucket (ej: 'reviews', 'avatars')
   */
  uploadFile(file: File, folder?: string): Promise<StorageUploadResult>

  /**
   * Sube una imagen referenciada por URL (útil para importar imágenes externas).
   * @param url  URL pública de la imagen a importar
   * @param folder  Carpeta opcional
   */
  uploadByUrl(url: string, folder?: string): Promise<StorageUploadResult>
}
