# Variables de entorno — Storage Provider

Agregá estas variables a tu `.env.local`:

```env
# ─── Storage — imágenes en reviews y perfiles ─────────────────────────────────

# Cloudinary (free: 25 GB storage + 25 GB BW/mes) — https://cloudinary.com
#
# Setup:
# 1. Crear cuenta en https://cloudinary.com
# 2. Dashboard → Settings → Upload → Upload presets → Add preset
# 3. Signing mode: Unsigned → Save
# 4. Copiar los valores de tu Dashboard:

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="tu-unsigned-preset"
```

> **Sin estas variables** → el sistema usa `LocalStorageProvider` como fallback:
> las imágenes se almacenan como blob URLs temporales (se pierden al recargar).
> Esto es intencional para no bloquear el desarrollo local.

## Agregar otro proveedor

1. Crear `src/shared/services/storage/providers/<nombre>.ts` implementando `IStorageProvider`
2. En `src/shared/services/storage/index.ts`, agregar la condición de bootstrap:
   ```ts
   if (process.env.NEXT_PUBLIC_MY_PROVIDER_KEY) {
     return new MyStorageProvider()
   }
   ```
3. Los consumers (`editor-tools.ts`, etc.) **no cambian**.
