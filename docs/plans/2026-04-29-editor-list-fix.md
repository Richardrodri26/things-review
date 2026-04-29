# Editor List Fix (Bullet Points) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corregir el editor de reviews para que bullet points y listas ordenadas funcionen correctamente con `@editorjs/list` v2.

**Architecture:** `@editorjs/list` v2.0.x cambió el formato de datos de `items: string[]` a `items: [{ content: string, meta: {}, items: [] }]`. Hay 3 capas afectadas: (1) el tipo `ListData` que modela los datos, (2) el `EditorRenderer` que los renderiza en modo lectura, y (3) el CSS en `globals.css` donde Tailwind preflight elimina los estilos nativos de `ul`/`ol` (bullets, numeración, padding) y no se restauran para las clases de EditorJS.

**Tech Stack:** TypeScript, React 19, Tailwind CSS 4, `@editorjs/list` v2.0.9, EditorJS 2.31.x

---

## File Map

| Acción | Archivo | Qué cambia |
|--------|---------|------------|
| Modify | `src/types/editor.ts` | `ListData.items` pasa de `string[]` a formato v2 con backward compat |
| Modify | `src/components/editor/editor-renderer.tsx` | Case `list` renderiza formato v2 (recursivo para nested items) |
| Modify | `src/components/editor/editor-client.tsx` | `extractPlainText()` maneja formato v2 |
| Modify | `src/app/globals.css` | Agregar `list-style-type`, `padding-inline-start` a `.cdx-list` |

---

## Contexto: formato v2 de @editorjs/list

El editor **guarda** datos en este formato (v2):

```json
{
  "type": "list",
  "data": {
    "style": "unordered",
    "meta": {},
    "items": [
      { "content": "Primer item", "meta": {}, "items": [] },
      {
        "content": "Item con subitems",
        "meta": {},
        "items": [
          { "content": "Subitem", "meta": {}, "items": [] }
        ]
      }
    ]
  }
}
```

El código actual espera formato v1: `items: string[]`.  
El `EditorRenderer` llama `dangerouslySetInnerHTML={{ __html: item }}` donde `item` es un objeto, no un string — renderiza `[object Object]`.

---

## Task 1: Actualizar tipos

**Files:**
- Modify: `src/types/editor.ts`

- [ ] **Step 1: Actualizar `ListData` en `src/types/editor.ts`**

Reemplazar la interfaz `ListData` existente:

```ts
// Formato v2 de @editorjs/list (2.0.x+)
export interface ListItemV2 {
  content: string
  meta: Record<string, unknown>
  items: ListItemV2[]
}

export interface ListData {
  style: 'ordered' | 'unordered'
  meta?: Record<string, unknown>
  // v2: array de objetos; v1 legacy: array de strings
  items: ListItemV2[] | string[]
}
```

- [ ] **Step 2: Verificar que no rompe tipos en otros archivos**

```bash
npx tsc --noEmit
```

Esperado: 0 errores (o solo errores pre-existentes no relacionados).

- [ ] **Step 3: Commit**

```bash
git add src/types/editor.ts
git commit -m "fix(editor): update ListData type for @editorjs/list v2 format"
```

---

## Task 2: Corregir EditorRenderer

**Files:**
- Modify: `src/components/editor/editor-renderer.tsx`

El `EditorRenderer` se usa en modo lectura (ReviewDetailPage) para mostrar el contenido guardado. Actualmente el case `list` itera `items` asumiendo que son strings.

- [ ] **Step 1: Actualizar el case `list` en `BlockRenderer`**

Localizar el case `list` en `src/components/editor/editor-renderer.tsx` (línea ~71) y reemplazarlo completo:

```tsx
case 'list': {
  const { style, items } = data as ListData

  // Función recursiva para renderizar items v2 (con nested lists)
  const renderItems = (listItems: ListItemV2[] | string[], depth = 0): React.ReactNode => {
    return listItems.map((item, i) => {
      // Backward compat: v1 format (string[])
      if (typeof item === 'string') {
        return <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      }
      // v2 format: { content, items }
      return (
        <li key={i}>
          <span dangerouslySetInnerHTML={{ __html: item.content }} />
          {item.items.length > 0 && (
            style === 'ordered'
              ? <ol className="list-decimal list-outside ml-5 mt-1 space-y-1">{renderItems(item.items, depth + 1)}</ol>
              : <ul className="list-disc list-outside ml-5 mt-1 space-y-1">{renderItems(item.items, depth + 1)}</ul>
          )}
        </li>
      )
    })
  }

  const baseClass = 'list-outside ml-6 space-y-1.5 text-[17px] leading-[1.75] text-foreground'

  if (style === 'ordered') {
    return (
      <ol className={`list-decimal ${baseClass}`}>
        {renderItems(items)}
      </ol>
    )
  }
  return (
    <ul className={`list-disc ${baseClass}`}>
      {renderItems(items)}
    </ul>
  )
}
```

Agregar el import de `ListItemV2` al top del archivo (ya importa `ListData`):

```ts
import type {
  HeaderData,
  ParagraphData,
  ListData,
  ListItemV2,   // ← agregar
  QuoteData,
  CodeData,
  ImageData,
  ChecklistData,
} from '@/types/editor'
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/editor-renderer.tsx
git commit -m "fix(editor): render @editorjs/list v2 nested format in EditorRenderer"
```

---

## Task 3: Corregir extractPlainText

**Files:**
- Modify: `src/components/editor/editor-client.tsx`

`extractPlainText()` se usa para mostrar previews de reviews en cards. Actualmente el case `list` también asume v1.

- [ ] **Step 1: Actualizar el case `list` en `extractPlainText`**

Localizar en `src/components/editor/editor-client.tsx` (línea ~154) y reemplazar:

```ts
case 'list': {
  const listData = blockData as { items: Array<string | { content: string; items: unknown[] }> }

  const extractItem = (item: string | { content: string; items: unknown[] }): string => {
    if (typeof item === 'string') return item.replace(/<[^>]*>/g, '')
    return item.content.replace(/<[^>]*>/g, '')
  }

  return listData.items.map(extractItem).join('\n')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/editor-client.tsx
git commit -m "fix(editor): update extractPlainText for @editorjs/list v2 format"
```

---

## Task 4: Corregir CSS (bullets y numeración visibles)

**Files:**
- Modify: `src/app/globals.css`

Tailwind preflight hace `list-style: none` en todos los `ul`/`ol`. El editor renderiza sus listas con clases `.cdx-list` y `.cdx-list--unordered` / `.cdx-list--ordered`, pero el CSS actual solo define `color` y `line-height` — sin restaurar bullets ni padding.

- [ ] **Step 1: Actualizar la sección `/* List block */` en `globals.css`**

Localizar la sección existente (línea ~483):

```css
/* List block */
.cdx-list {
  color: var(--foreground);
}

.cdx-list__item {
  line-height: 1.75rem;
}
```

Reemplazar con:

```css
/* List block — restaurar estilos que Tailwind preflight elimina */
.cdx-list {
  color: var(--foreground);
  padding-inline-start: 1.5rem;
}

.cdx-list--unordered {
  list-style-type: disc;
}

.cdx-list--ordered {
  list-style-type: decimal;
}

.cdx-list__item {
  line-height: 1.75rem;
  padding-left: 0.25rem;
}

/* Nested lists dentro del editor (v2 soporta anidamiento) */
.cdx-list__item .cdx-list {
  margin-top: 0.25rem;
}
```

- [ ] **Step 2: Smoke test visual**

Abrir el editor en la app, crear una lista con bullets y otra numerada, verificar que:
- Los bullets (•) aparecen visualmente
- La numeración (1. 2. 3.) aparece
- El indentado es correcto
- Los nested items también muestran bullets

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "fix(editor): restore list-style bullets removed by Tailwind preflight"
```

---

## Notas de verificación final

Después de los 4 tasks, el flujo completo a verificar:

1. **Crear** una review con bullets (`- Item 1`, `- Item 2`)
2. **Guardar** la review
3. **Ver** la review en detalle — bullets deben aparecer en `EditorRenderer`
4. **Ver** la review en una card/preview — `extractPlainText` debe mostrar el texto limpio
5. **Editar** la review — el editor debe cargar los datos guardados correctamente
