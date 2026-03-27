# Roadmap — Things Review

## Visión a largo plazo

**Things Review** evoluciona en 3 fases principales:

1. **v1 — Client-only MVP**: Todo en el cliente, sin backend, sin auth
2. **v2 — Social + Backend**: Backend real, autenticación, grupos en tiempo real  
3. **v3 — Plataforma multi-contenido**: Expansión a libros, videojuegos, música

---

## Fase 1 — MVP Client-only

**Objetivo:** Tener un producto funcional que demuestre el valor core de la app.  
**Restricción:** Sin backend. Todo en localStorage.  
**Duración estimada:** 6-8 semanas

### Sprint 1 — Fundaciones (Semanas 1-2)

- [ ] Setup de arquitectura base (carpetas, aliases, providers)
- [ ] Configurar i18n (next-intl) para EN/ES
- [ ] Crear sistema de design tokens (colores, tipografía, espaciado)
- [ ] Implementar atoms y molecules base del sistema de diseño
- [ ] Configurar Zustand store con Immer (slices de todas las entidades)
- [ ] Implementar capa de servicios localStorage
- [ ] Crear schemas Zod para todas las entidades
- [ ] Setup de TanStack Query con adapters para localStorage

### Sprint 2 — Autenticación local y perfil (Semanas 2-3)

- [ ] Pantalla de onboarding (crear perfil local)
- [ ] Formulario de perfil con TanStack Form + Zod
- [ ] Persistencia de usuario en localStorage
- [ ] Página de perfil con estadísticas básicas

### Sprint 3 — Catálogo de películas y series (Semanas 3-4)

- [ ] Integración con TMDB API (búsqueda, detalle)
- [ ] Página de catálogo con búsqueda y filtros
- [ ] TanStack Table para listados
- [ ] Página de detalle de película/serie
- [ ] Caché de respuestas TMDB en localStorage

### Sprint 4 — Sistema de Reviews (Semanas 4-5)

- [ ] Formulario de crear review (TanStack Form + Zod)
- [ ] Rating con estrellas (1-5)
- [ ] Estados: watched, want_to_watch, watching, dropped
- [ ] Editar y eliminar review
- [ ] Página "Mis reviews" con filtros y tabla (TanStack Table)
- [ ] Vista de reviews en detalle de película/serie

### Sprint 5 — Grupos (Semanas 5-7)

- [ ] Crear grupo
- [ ] Invitar por código
- [ ] Lista de grupos del usuario
- [ ] Página de detalle del grupo
- [ ] Ver reviews de todos los miembros sobre una película/serie
- [ ] Cálculo de puntaje grupal (promedio)
- [ ] Ranking de películas del grupo
- [ ] Grupos públicos vs privados

### Sprint 6 — Polish y QA (Semana 7-8)

- [ ] Revisar UX completo (flows de usuario)
- [ ] Loading states y error states en todos los flujos
- [ ] Responsive design (mobile first)
- [ ] Modo oscuro completo
- [ ] Accesibilidad básica (aria labels, keyboard nav)
- [ ] Performance audit (Lighthouse)
- [ ] Traducir todos los textos a ES/EN

---

## Fase 2 — Backend + Auth

**Objetivo:** Hacer la app real con persistencia en servidor y usuarios reales.  
**Requisito previo:** Completar Fase 1.

### Módulos a desarrollar

#### Backend (API)
- [ ] Seleccionar stack backend (recomendado: **Next.js API Routes** para simplificar, o **Express/Fastify** + PostgreSQL)
- [ ] Diseño de base de datos (PostgreSQL recomendado)
- [ ] Autenticación con **Better Auth** (Google OAuth + email/password + magic link)
- [ ] API REST para todas las entidades
- [ ] Validaciones server-side con Zod
- [ ] Configurar Datadog APM para monitoreo de la API
- [ ] Configurar Datadog RUM para monitoreo del frontend

#### Frontend (migración de servicios)
- [ ] Cambiar `LocalReviewService` → `ApiReviewService` (UN cambio en services.ts)
- [ ] Configurar TanStack Query para HTTP (ya preparado en v1)
- [ ] Integrar sesión de Better Auth en el cliente
- [ ] Páginas de login/register/logout
- [ ] Migrar `logger` de consola a Datadog Log Management

#### Features nuevas de la fase
- [ ] Invitaciones por email
- [ ] Notificaciones in-app (alguien reviewó algo que vos viste)
- [ ] Feed de actividad del grupo
- [ ] Búsqueda de usuarios por username

---

## Fase 3 — Multi-contenido

**Objetivo:** Expandir más allá de películas y series.

### Nuevos tipos de contenido

| Contenido | API de datos | Prioridad |
|---|---|---|
| Libros | Google Books API | Alta |
| Videojuegos | RAWG API | Media |
| Álbumes de música | Spotify API | Media |
| Podcasts | Spotify Podcasts | Baja |
| Juegos de mesa | BoardGameGeek API | Baja |

### Features de la plataforma

- [ ] Sistema de "Things" genérico (cualquier contenido reviewable)
- [ ] Listas personalizadas ("Top 10 de Terror", "Pendientes 2025")
- [ ] Recomendaciones basadas en gustos del grupo
- [ ] Exportar reviews (PDF, CSV)
- [ ] Widgets embebibles para blogs/portfolios
- [ ] API pública documentada

---

## Métricas de éxito por fase

### Fase 1
- Usuario puede crear su perfil, registrar reviews y crear un grupo
- Flujo completo funciona sin errores en Chrome, Firefox, Safari
- Lighthouse performance score > 90
- 100% de textos traducidos a EN/ES

### Fase 2
- Tiempo de registro < 2 minutos
- Tiempo de carga inicial < 3 segundos
- 0 pérdida de datos en migración desde localStorage
- Auth funciona con Google OAuth

### Fase 3
- El sistema de "Things" soporta al menos 3 tipos de contenido
- API pública documentada con OpenAPI/Swagger

---

## Dependencias y riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| TMDB API rate limiting | Alto | Caché agresivo en localStorage/React Query |
| localStorage lleno (5MB límite) | Medio | Limpiar caché de películas, comprimir datos |
| Migración a backend pierde datos | Alto | Export/import manual antes de migrar |
| TMDB API cambia precios/términos | Medio | Abstraer con interface, fácil cambiar de proveedor |
