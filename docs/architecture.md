# Arquitectura de Software — Things Review

## Arquitectura recomendada: Feature-Sliced Design + Clean Architecture (adaptado)

### ¿Por qué esta arquitectura?

Para un proyecto de esta naturaleza (client-first ahora, backend en el futuro), recomiendo una **arquitectura por features (Feature-Sliced Design)** combinada con los principios de **Clean Architecture** adaptados al frontend.

**El problema con arquitecturas típicas de Next.js:**
```
/components
/pages
/hooks
/utils
```
Esto escala muy mal. Cuando agregás 20 features más, nadie sabe dónde está nada.

**El problema con Clean Architecture pura en frontend:**
Es excesiva para proyectos que no tienen lógica de dominio muy compleja. Termina siendo burocracia.

**La solución: Feature-Sliced Design con capas simplificadas**

---

## Capas de la arquitectura

```
┌─────────────────────────────────────────────┐
│                    PAGES                     │  ← Next.js App Router (UI entry points)
├─────────────────────────────────────────────┤
│                   FEATURES                   │  ← Lógica de negocio por dominio
├─────────────────────────────────────────────┤
│                   ENTITIES                   │  ← Modelos y tipos del dominio
├─────────────────────────────────────────────┤
│                   SHARED                     │  ← UI atómica, utils, servicios
└─────────────────────────────────────────────┘
```

### Regla de dependencias
Las capas solo pueden importar de capas **inferiores**. NUNCA al revés.

```
pages     → puede usar features, entities, shared
features  → puede usar entities, shared
entities  → puede usar shared
shared    → no importa nada interno
```

---

## Capas en detalle

### 1. `shared/` — Base de todo

Contiene todo lo que es reutilizable sin depender de lógica de negocio:

```
shared/
  ui/           → Componentes propios (Atomic Design: atoms, molecules, organisms)
                  ⚠️  Wrappean los componentes de shadcn, nunca se usa shadcn directo desde features
  lib/          → Configuraciones: axios, i18n, zustand base
  hooks/        → Hooks genéricos (useDebounce, useLocalStorage, useMediaQuery)
  utils/        → Funciones puras (formatDate, formatRating, cn)
  types/        → Tipos base y primitivos compartidos
  constants/    → Constantes globales (ROUTES, GENRES, STATUS_OPTIONS)
  services/     → Capa de abstracción para datos (hoy: localStorage, mañana: API)
  schemas/      → Schemas Zod base reutilizables
```

### 2. `entities/` — El dominio

Los modelos de negocio, SIN lógica de UI:

```
entities/
  movie/
    types.ts        → interfaces Movie, MovieDetail
    schema.ts       → Zod schema de Movie
    store.ts        → Zustand slice de movies
    service.ts      → MovieService (abstracción)
  series/
    types.ts
    schema.ts
    store.ts
    service.ts
  review/
    types.ts
    schema.ts
    store.ts
    service.ts
  group/
    types.ts
    schema.ts
    store.ts
    service.ts
  user/
    types.ts
    schema.ts
    store.ts
    service.ts
```

### 3. `features/` — Casos de uso

Cada feature es un módulo autocontenido con su UI, lógica y estado:

```
features/
  review-create/       → Formulario para crear una review
  review-list/         → Lista de reviews con filtros
  group-create/        → Crear un grupo
  group-invite/        → Invitar a alguien a un grupo
  group-reviews/       → Ver reviews colectivas del grupo
  movie-search/        → Búsqueda y filtrado de películas
  series-search/       → Búsqueda y filtrado de series
  rating-summary/      → Widget de puntaje promedio grupal
```

Estructura interna de una feature:
```
features/review-create/
  index.ts             → Public API (exports)
  ui/
    ReviewForm.tsx
    RatingInput.tsx
  model/
    useReviewForm.ts   → Lógica del form con TanStack Form
    review.schema.ts   → Zod schema específico del form
  api/
    createReview.ts    → Llama al servicio de entities
```

### 4. `app/` — Pages (Next.js App Router)

Solo orquesta features. NO tiene lógica de negocio propia:

```
app/
  (root)/
    page.tsx           → Home / Landing
  movies/
    page.tsx           → Catálogo de películas
    [id]/
      page.tsx         → Detalle de película
  series/
    page.tsx           → Catálogo de series
    [id]/
      page.tsx         → Detalle de serie
  reviews/
    page.tsx           → Mis reviews
  groups/
    page.tsx           → Mis grupos
    [id]/
      page.tsx         → Detalle de grupo
  profile/
    page.tsx           → Mi perfil
```

---

## Capa de Servicios — La clave del Backend-Ready

Esta es la parte MÁS IMPORTANTE de la arquitectura. Los servicios son abstracciones que hoy leen de `localStorage` y mañana llaman a una API sin cambiar nada en las features.

```typescript
// shared/services/review.service.ts

export interface IReviewService {
  getAll(): Promise<Review[]>
  getById(id: string): Promise<Review | null>
  create(data: CreateReviewDTO): Promise<Review>
  update(id: string, data: UpdateReviewDTO): Promise<Review>
  delete(id: string): Promise<void>
  getByMovieId(movieId: string): Promise<Review[]>
  getGroupReviews(groupId: string, movieId: string): Promise<Review[]>
}

// Implementación v1: localStorage
export class LocalReviewService implements IReviewService { ... }

// Implementación v2: HTTP API (futuro)
export class ApiReviewService implements IReviewService { ... }
```

El servicio activo se inyecta vía un **Service Container** (simple objeto de config):

```typescript
// shared/lib/services.ts
export const services = {
  reviews: new LocalReviewService(),
  movies: new LocalMovieService(),
  groups: new LocalGroupService(),
  users: new LocalUserService(),
}
```

Cuando llegue el backend, solo se cambia `LocalReviewService` por `ApiReviewService` en UN lugar.

---

## Estado global con Zustand + Immer

Cada entity tiene su propio slice de Zustand. El store global es la composición de todos:

```typescript
// shared/lib/store.ts
const useStore = create<RootState>()(
  immer((...args) => ({
    ...createMoviesSlice(...args),
    ...createReviewsSlice(...args),
    ...createGroupsSlice(...args),
    ...createUserSlice(...args),
  }))
)
```

---

## Flujo de datos

```
Usuario interactúa con Feature UI
  → Feature llama al Service (entities/*/service.ts)
  → Service lee/escribe en localStorage
  → Service actualiza Zustand store
  → Zustand notifica → UI re-renderiza
```

Con TanStack Query (para el caché y async state):
```
Feature UI → useQuery / useMutation
  → queryFn llama al Service
  → Service hace el trabajo
  → TanStack Query cachea el resultado
  → UI muestra el dato cacheado
```

---

## Formularios — Patrón TanStack Form + shadcn

> Fuente oficial: https://ui.shadcn.com/docs/forms/tanstack-form

### Anatomía base

Todo formulario sigue esta estructura:

```tsx
<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
  <FieldGroup>
    <form.Field
      name="fieldName"
      children={(field) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>Label</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  </FieldGroup>
  <Button type="submit">Guardar</Button>
</form>
```

### Setup del form

```tsx
import { useForm } from "@tanstack/react-form"
import { z } from "zod"

const formSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
})

const form = useForm({
  defaultValues: { title: "" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => { /* llamar al service */ },
})
```

### Reglas de validación + errores

- `data-invalid` va en `<Field />` — controla el estilo del wrapper
- `aria-invalid` va en el control (`<Input />`, `<SelectTrigger />`, `<Checkbox />`, etc.) — accesibilidad
- `<FieldError errors={field.state.meta.errors} />` muestra los mensajes de Zod
- `isInvalid = field.state.meta.isTouched && !field.state.meta.isValid` — solo mostrar errores después de que el usuario tocó el campo

### Modos de validación

```tsx
validators: {
  onSubmit: formSchema,   // solo al enviar (default recomendado)
  onChange: formSchema,   // en cada tecla
  onBlur: formSchema,     // al salir del campo
}
```

### Tipos de campo

#### Input de texto
```tsx
<Input
  id={field.name}
  name={field.name}
  value={field.state.value}
  onBlur={field.handleBlur}
  onChange={(e) => field.handleChange(e.target.value)}
  aria-invalid={isInvalid}
/>
```

#### Textarea
```tsx
<Textarea
  id={field.name}
  name={field.name}
  value={field.state.value}
  onBlur={field.handleBlur}
  onChange={(e) => field.handleChange(e.target.value)}
  aria-invalid={isInvalid}
/>
```

#### Select
```tsx
<Select
  name={field.name}
  value={field.state.value}
  onValueChange={field.handleChange}
>
  <SelectTrigger id={field.name} aria-invalid={isInvalid}>
    <SelectValue placeholder="Elegir..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="movie">Película</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox (único)
```tsx
<Checkbox
  id={field.name}
  name={field.name}
  checked={field.state.value}
  onCheckedChange={field.handleChange}
  aria-invalid={isInvalid}
/>
```

#### Checkbox (array)
```tsx
<form.Field name="tags" mode="array" children={(field) => (
  <FieldGroup data-slot="checkbox-group">
    {options.map((opt) => (
      <Field key={opt.id} orientation="horizontal">
        <Checkbox
          checked={field.state.value.includes(opt.id)}
          onCheckedChange={(checked) => {
            if (checked) field.pushValue(opt.id)
            else field.removeValue(field.state.value.indexOf(opt.id))
          }}
        />
        <FieldLabel>{opt.label}</FieldLabel>
      </Field>
    ))}
  </FieldGroup>
)} />
```

#### Switch
```tsx
<Switch
  id={field.name}
  name={field.name}
  checked={field.state.value}
  onCheckedChange={field.handleChange}
  aria-invalid={isInvalid}
/>
```

### Reset
```tsx
<Button type="button" variant="outline" onClick={() => form.reset()}>
  Cancelar
</Button>
```

### Reglas del proyecto

1. **Siempre usar `onSubmit` como modo de validación** salvo necesidad explícita de feedback en tiempo real
2. **El schema Zod vive en `features/<feature>/model/<feature>.schema.ts`** — nunca inline en el componente
3. **`useForm` vive en un hook propio** `features/<feature>/model/use<Feature>Form.ts` — el componente solo renderiza
4. **Nunca usar `<form>` nativo directo** desde una feature — siempre pasar por el patrón `form.handleSubmit()` con `e.preventDefault()`
5. **Los botones de acción** (submit + reset) van fuera del `<FieldGroup />`, en el footer del card o del overlay

---

## Responsive UI — Patrón Dialog/Drawer

**Regla: TODO overlay usa `Dialog` en desktop y `Drawer` en mobile. Sin excepciones.**

Esto incluye: crear review, editar review, crear grupo, invitar usuario, confirmar eliminación, ver detalle rápido, etc.

### Implementación

```tsx
// shared/ui/molecules/ResponsiveOverlay.tsx
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}

export function ResponsiveOverlay({ open, onOpenChange, title, children }: Props) {
  const isDesktop = useMediaQuery("min-md")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Form className="contents">{children}</Form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <Form className="contents">{children}</Form>
      </DrawerContent>
    </Drawer>
  )
}
```

### Reglas

1. `useMediaQuery("max-md")` desde `coss` — no crear uno custom
2. El contenido compartido (formulario, botones) va dentro de `<Form className="contents">` para que no rompa el layout en ninguno de los dos contenedores
3. El componente que dispara el overlay solo maneja `open` / `onOpenChange` — no sabe si es Dialog o Drawer
4. Partícula de referencia: `p-drawer-12` en el skill `coss`

---

## Decisiones de arquitectura (ADRs)

### ADR-001: Feature-Sliced Design sobre estructura por tipo
**Contexto:** Necesitamos escalar a múltiples dominios (movies, series, groups).  
**Decisión:** Organizar por feature/dominio, no por tipo de archivo.  
**Consecuencia:** Mejor cohesión, más fácil encontrar código relacionado.

### ADR-002: Capa de servicios abstracta desde v1
**Contexto:** Empezamos client-only pero habrá backend.  
**Decisión:** Implementar interfaces de servicio desde el inicio.  
**Consecuencia:** Migración a backend sin tocar features ni componentes.

### ADR-003: TanStack Query para todo async state
**Contexto:** Aunque sea localStorage hoy, mañana será HTTP.  
**Decisión:** Usar TanStack Query como capa de async state desde el inicio.  
**Consecuencia:** Caché, loading states, error handling gratis. Migración trivial.

### ADR-004: Zustand + Immer para estado sincrónico
**Contexto:** Estado de UI, filtros activos, usuario actual.  
**Decisión:** Zustand con Immer para mutaciones inmutables legibles.  
**Consecuencia:** Menos boilerplate, mutaciones directas pero inmutables bajo el capó.

### ADR-005: Atomic Design para componentes shared
**Contexto:** Sistema de diseño consistente.  
**Decisión:** Atoms → Molecules → Organisms → Templates → Pages.  
**Consecuencia:** Componentes reutilizables y jerarquía clara.

### ADR-006: shadcn vive en `components/ui/`, nunca se importa directo desde features
**Contexto:** shadcn CLI tiene sus rutas hardcodeadas en `components.json` (`"ui": "@/components/ui"`). Cambiarlas rompe la CLI.  
**Decisión:** Respetar las rutas de shadcn. Crear wrappers en `shared/ui/atoms/` y `shared/ui/molecules/` que consumen los primitivos de shadcn. Features y pages solo importan de `shared/ui/`.  
**Consecuencia:** shadcn es un detalle de implementación. Si en el futuro se cambia de librería de UI, el cambio es en `shared/ui/`, no en 50 features distintas.

### ADR-007: Dialog en desktop, Drawer en mobile para todos los overlays
**Contexto:** Los overlays (crear review, crear grupo, invitar usuario, etc.) deben ser usables en mobile. Un `Dialog` centrado en pantalla chica es mala UX.  
**Decisión:** Usar el patrón responsivo de `coss`: `Dialog` en `≥ md`, `Drawer` en `< md`, detectado con `useMediaQuery("max-md")`. El contenido del overlay (formulario, título, acciones) se comparte entre ambos via un componente interno con `className="contents"`. Referencia: partícula `p-drawer-12`.  
**Consecuencia:** UX nativa en mobile sin duplicar código. Todos los overlays de la app siguen el mismo patrón consistente.
