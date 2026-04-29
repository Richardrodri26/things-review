# Storage Provider (Image Uploads) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar los blob URLs temporales del editor de imágenes por un sistema de storage persistente con arquitectura provider-agnostic, usando Cloudinary (free tier) como proveedor por defecto.

**Architecture:** Se crea `src/shared/services/storage/` siguiendo la misma convención Clean Architecture que los content providers (`ContentProvider` interface + implementaciones). La diferencia es que storage es single-active (un proveedor a la vez), no fan-out. Un barrel export `storageProvider` oculta el proveedor activo a los consumers. El `editor-tools.ts` reemplaza `URL.createObjectURL` por `storageProvider.uploadFile()`. Si `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` no está configurado, usa un fallback local de dev (blob URL, comportamiento actual) para no romper el flujo de desarrollo.

**Tech Stack:** TypeScript, Next.js 16, `@editorjs/image` 2.10.x, Cloudinary Upload API (unsigned preset, no SDK)

---

## File Map

| Acción | Archivo | Qué cambia |
|--------|---------|------------|
| Create | `src/shared/services/storage/types.ts` | `IStorageProvider` interface + `StorageUploadResult` type |
| Create | `src/shared/services/storage/providers/local.ts` | `LocalStorageProvider` — dev fallback con blob URLs |
| Create | `src/shared/services/storage/providers/cloudinary.ts` | `CloudinaryStorageProvider` — upload unsigned via fetch |
| Create | `src/shared/services/storage/index.ts` | Bootstrap + barrel export de `storageProvider` |
| Modify | `src/components/editor/editor-tools.ts` | Reemplazar `URL.createObjectURL` por `storageProvider` |
| Modify | `.env.example` | Agregar variables de Cloudinary documentadas |

---

## Contexto: Cloudinary free tier

- **Plan Free:** 25 GB storage + 25 GB bandwidth/mes
- **Upload sin SDK:** `POST https://api.cloudinary.com/v1_1/{cloud_name}/upload`
- **Unsigned preset:** Se crea en Cloudinary Dashboard → Settings → Upload → Upload presets → Add preset → Signing mode: Unsigned
- **Sin server:** El upload va directo browser → Cloudinary CDN (sin pasar por Next.js)
- **Respuesta:** `{ secure_url, public_id, format, width, height, bytes }`

---

## Task 1: Interface `IStorageProvider`

**Files:**
- Create: `src/shared/services/storage/types.ts`

- [ ] **Step 1: Crear `src/shared/services/storage/types.ts`**

```ts
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/services/storage/types.ts
git commit -m "feat(storage): add IStorageProvider interface"
```

---

## Task 2: `LocalStorageProvider` (dev fallback)

**Files:**
- Create: `src/shared/services/storage/providers/local.ts`

Este provider usa `URL.createObjectURL()` — el comportamiento actual del editor. Las URLs son temporales (se invalidan al recargar), pero sirven para desarrollo sin configurar Cloudinary.

- [ ] **Step 1: Crear `src/shared/services/storage/providers/local.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/services/storage/providers/local.ts
git commit -m "feat(storage): add LocalStorageProvider dev fallback"
```

---

## Task 3: `CloudinaryStorageProvider`

**Files:**
- Create: `src/shared/services/storage/providers/cloudinary.ts`

Upload directo browser → Cloudinary vía `fetch` con `multipart/form-data`. Sin SDK de Cloudinary — solo fetch nativo para no agregar dependencias.

- [ ] **Step 1: Crear `src/shared/services/storage/providers/cloudinary.ts`**

```ts
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
  private readonly uploadUrl: string

  constructor(cloudName?: string, uploadPreset?: string) {
    this.cloudName = cloudName ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
    this.uploadPreset = uploadPreset ?? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`
  }

  async uploadFile(file: File, folder?: string): Promise<StorageUploadResult> {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', this.uploadPreset)
    if (folder) form.append('folder', folder)

    return this.doUpload(form)
  }

  async uploadByUrl(url: string, folder?: string): Promise<StorageUploadResult> {
    const form = new FormData()
    form.append('file', url)
    form.append('upload_preset', this.uploadPreset)
    if (folder) form.append('folder', folder)

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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/services/storage/providers/cloudinary.ts
git commit -m "feat(storage): add CloudinaryStorageProvider with unsigned upload"
```

---

## Task 4: Bootstrap + barrel export

**Files:**
- Create: `src/shared/services/storage/index.ts`

- [ ] **Step 1: Crear `src/shared/services/storage/index.ts`**

```ts
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/services/storage/index.ts
git commit -m "feat(storage): bootstrap storageProvider with env-based provider selection"
```

---

## Task 5: Wiring con el editor

**Files:**
- Modify: `src/components/editor/editor-tools.ts`

- [ ] **Step 1: Actualizar `editor-tools.ts`**

Localizar la config del tool `image` (línea ~87) y reemplazar el bloque `uploader`:

```ts
// Agregar import al top del archivo:
import { storageProvider } from '@/shared/services/storage'
```

Reemplazar el objeto `uploader` existente:

```ts
uploader: {
  uploadByFile: async (file: File) => {
    try {
      const result = await storageProvider.uploadFile(file, 'reviews')
      return { success: 1, file: { url: result.url } }
    } catch (error) {
      console.error('[Editor] Image upload failed:', error)
      return { success: 0, file: { url: '' } }
    }
  },
  uploadByUrl: async (url: string) => {
    try {
      const result = await storageProvider.uploadByUrl(url, 'reviews')
      return { success: 1, file: { url: result.url } }
    } catch (error) {
      console.error('[Editor] Image import failed:', error)
      return { success: 0, file: { url: '' } }
    }
  },
},
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke test**

Con Cloudinary configurado:
1. Abrir el editor de reviews
2. Insertar un bloque Image → subir un archivo
3. Verificar que la URL en el output es `https://res.cloudinary.com/...`
4. Guardar la review y recargar — la imagen debe seguir visible

Sin Cloudinary configurado (solo `.env.local` sin las vars):
1. Misma prueba — debe funcionar con blob URL (mensaje de advertencia en consola está bien)

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/editor-tools.ts
git commit -m "feat(editor): wire image tool to storageProvider"
```

---

## Task 6: Documentar variables de entorno

**Files:**
- Modify: `.env.example`
- Modify: `src/shared/services/providers/ENV.md` (o crear `src/shared/services/storage/ENV.md`)

- [ ] **Step 1: Agregar vars a `.env.example`**

Agregar al final del archivo `.env.example`:

```env

# ─── Storage — imágenes en reviews y perfiles ─────────────────────────────────
# Cloudinary (free: 25GB storage + 25GB BW/mes) — https://cloudinary.com
# 1. Crear cuenta en cloudinary.com
# 2. Dashboard → Settings → Upload → Upload presets → Add preset
# 3. Signing mode: Unsigned → Save
# 4. Copiar el nombre del preset en UPLOAD_PRESET
# Sin estas vars → fallback a blob URLs locales (solo para dev)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""
```

- [ ] **Step 2: Commit final**

```bash
git add .env.example
git commit -m "docs: add Cloudinary storage env vars to .env.example"
```

---

## Para cambiar de proveedor en el futuro

Para migrar de Cloudinary a S3, Uploadthing u otro servicio:

1. Crear `src/shared/services/storage/providers/s3.ts` implementando `IStorageProvider`
2. En `src/shared/services/storage/index.ts`, agregar la condición:
   ```ts
   if (process.env.NEXT_PUBLIC_AWS_S3_BUCKET) {
     return new S3StorageProvider()
   }
   ```
3. Los consumers (`editor-tools.ts`, etc.) **no cambian**.
