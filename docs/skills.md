# Skills — Things Review

> Qué skill cargar según el contexto. El agente debe leer el skill correspondiente ANTES de escribir cualquier código.
> Múltiples skills pueden aplicar al mismo tiempo (ej: un componente nuevo → `frontend-design` + `react-19` + `tailwind-4` + `typescript`).

---

## Tabla de referencia rápida

| Contexto | Skill |
|---|---|
| Crear componente, página, layout o cualquier UI | `frontend-design` |
| Componente React, hook, JSX | `react-19` |
| Ruta, Server Component, Server Action, data fetching | `nextjs-15` |
| Tipos, interfaces, generics, DTOs, enums | `typescript` |
| Clases Tailwind, tema, tokens, variables CSS | `tailwind-4` |
| Schema Zod, validación de formulario o DTO | `zod-4` |
| Store Zustand, slice, estado global | `zustand-5` |
| Agregar o usar componentes de shadcn | `shadcn` |
| Cualquier componente UI de coss (botones, inputs, overlays, badges, etc.) | `coss` |
| Tests E2E con Playwright | `playwright` |
| Planificar una feature nueva antes de escribir código | `writing-plans` |
| Ejecutar un plan ya escrito | `executing-plans` |
| Bug, test que falla, comportamiento inesperado | `systematic-debugging` |
| Review de performance en React o Next.js | `vercel-react-best-practices` |
| Al terminar cualquier cambio en React | `react-doctor` |

---

## Combinaciones frecuentes

Estos son los grupos de skills que se usan juntos en los escenarios más comunes del proyecto:

### Nuevo componente de UI
`frontend-design` + `react-19` + `tailwind-4` + `typescript`

### Nuevo componente con shadcn
`frontend-design` + `shadcn` + `react-19` + `tailwind-4` + `typescript`

### Nuevo componente con coss
`frontend-design` + `coss` + `react-19` + `tailwind-4` + `typescript`

### Overlay responsivo (modal → drawer)
`coss` + `react-19` + `tailwind-4` + `typescript`
> Ver patrón en: [architecture.md — Responsive UI](./architecture.md#responsive-ui)

### Nuevo formulario
`react-19` + `zod-4` + `typescript` + `tailwind-4`

### Nueva ruta / página
`nextjs-15` + `react-19` + `typescript` + `tailwind-4`

### Nuevo store o slice
`zustand-5` + `typescript`

### Nueva feature completa (de cero)
1. Primero: `writing-plans`
2. Luego al ejecutar: `executing-plans` + las skills del stack que correspondan
3. Al terminar: `react-doctor` + `vercel-react-best-practices`

### Bug o comportamiento raro
`systematic-debugging` → luego las skills del área afectada

---

## Regla general

Si hay duda sobre si cargar un skill o no, **cargarlo**. El costo de leerlo es bajo. El costo de escribir código inconsistente con los patrones del proyecto es alto.
