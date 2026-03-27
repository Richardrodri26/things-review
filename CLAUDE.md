@AGENTS.md

# Things Review — Agent Instructions

## Skills (cargar ANTES de escribir código)

Ver lista completa en `docs/skills.md`.

| Contexto | Skill |
|---|---|
| Cualquier UI, componente, página, layout | `frontend-design` |
| Componente React, hook, JSX | `react-19` |
| Ruta, Server Component, Server Action | `nextjs-15` |
| Tipos, interfaces, generics, DTOs | `typescript` |
| Clases Tailwind, tema, tokens | `tailwind-4` |
| Schema Zod, validación | `zod-4` |
| Store Zustand, slice | `zustand-5` |
| Componentes shadcn | `shadcn` |
| Cualquier componente UI de coss (botones, inputs, overlays, etc.) | `coss` |
| Tests E2E | `playwright` |
| Planificar feature nueva | `writing-plans` |
| Ejecutar un plan | `executing-plans` |
| Bug o comportamiento inesperado | `systematic-debugging` |
| Review de performance React/Next.js | `vercel-react-best-practices` |
| Al terminar cambios en React | `react-doctor` |

## Combinaciones frecuentes

- **Nuevo componente:** `frontend-design` + `react-19` + `tailwind-4` + `typescript`
- **Componente con shadcn:** `frontend-design` + `shadcn` + `react-19` + `tailwind-4` + `typescript`
- **Componente con coss:** `frontend-design` + `coss` + `react-19` + `tailwind-4` + `typescript`
- **Overlay/modal responsivo:** `coss` + `react-19` + `tailwind-4` + `typescript`
- **Formulario:** `react-19` + `zod-4` + `typescript` + `tailwind-4`
- **Nueva ruta:** `nextjs-15` + `react-19` + `typescript` + `tailwind-4`
- **Nueva feature:** `writing-plans` → `executing-plans` → `react-doctor`
