# Things Review — Documentación Interna

> Documentación técnica y de producto del proyecto **Things Review**.

## ¿Qué es Things Review?

**Things Review** es una aplicación web que permite a los usuarios registrar y compartir sus reviews de películas y series. Los usuarios pueden crear grupos con amigos o con la comunidad general para comparar opiniones, visualizar reviews combinadas y calcular puntajes grupales.

El sistema de puntuación es de **1 a 5 estrellas**, y las reviews se pueden agregar para obtener un promedio grupal.

---

## Índice de documentación

| Archivo | Descripción |
|---|---|
| [features.md](./features.md) | Features del producto, alcance v1 y futuras versiones |
| [architecture.md](./architecture.md) | Arquitectura de software recomendada y decisiones técnicas |
| [tech-stack.md](./tech-stack.md) | Stack tecnológico completo con justificación de cada elección |
| [data-models.md](./data-models.md) | Modelos de datos, campos y relaciones |
| [data-sources.md](./data-sources.md) | Sistema de providers para precargar info desde fuentes externas |
| [roadmap.md](./roadmap.md) | Roadmap del producto por fases |
| [folder-structure.md](./folder-structure.md) | Estructura de carpetas del proyecto (Atomic Design) |
| [i18n.md](./i18n.md) | Estrategia de internacionalización (EN / ES) |
| [skills.md](./skills.md) | Qué skill cargar según el contexto de desarrollo |

---

## Estado actual del proyecto

- **Fase:** Pre-desarrollo (documentación y planificación)
- **Stack base:** Next.js 16, React 19, Tailwind CSS 4, TypeScript 5
- **Versión:** 0.1.0
- **Alcance v1:** Client-only (sin backend), preparado para migración futura

---

## Principios del proyecto

1. **Client-first:** Toda la lógica en v1 vive en el cliente con persistencia local
2. **Backend-ready:** La arquitectura de servicios está desacoplada para facilitar la migración
3. **Multiidioma desde el día 1:** Inglés y Español desde el inicio
4. **Atomic Design:** Componentes organizados de átomos a páginas
5. **Type-safe end-to-end:** TypeScript estricto + Zod para validaciones
