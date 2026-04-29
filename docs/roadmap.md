# Roadmap — Things Review

## Visión a largo plazo

**Things Review** evoluciona en 3 fases principales:

1. ~~**v1 — Client-only MVP**~~ ✅ **COMPLETADO** (superado — se migró a backend real)
2. **v2 — Social + Backend**: Backend real, autenticación, storage de archivos ← *estamos aquí*
3. **v3 — Plataforma multi-contenido**: Expansión a libros, videojuegos, música

---

## Fase 1 — MVP Client-only ✅ COMPLETADO

> La fase 1 fue completada y superada. El proyecto migró directamente a backend real
> con Prisma + PostgreSQL antes de finalizar el plan original.

- ✅ Arquitectura base (Feature-Sliced Design, aliases, providers)
- ✅ i18n EN/ES con next-intl (cookie-based, sin prefijos en URL)
- ✅ Design tokens + shadcn/ui + Tailwind 4
- ✅ Zustand 5 + Immer (slices por entidad)
- ✅ TanStack Query 5 + TanStack Form
- ✅ Prisma + PostgreSQL (migrado desde localStorage)
- ✅ Better Auth (email/password instalado y configurado)
- ✅ Reviews CRUD completo con EditorJS
- ✅ Grupos con invite code
- ✅ Catálogo (películas, series) con provider registry
- ✅ TMDB API integrada (detrás de `TMDB_READ_ACCESS_TOKEN`)
- ✅ Content provider registry (TMDB, RAWG, OpenLibrary, MusicBrainz, iTunes)
- ✅ Dashboard con stats
- ✅ Comentarios con threading (1 nivel)
- ✅ Watchlist
- ✅ Perfil con estadísticas

---

## Fase 2 — Backend + Auth ← estamos aquí

**Objetivo:** Estabilizar el backend, completar auth real, agregar storage de archivos y polish.

### En progreso / Pendiente

#### 🐛 Bugs críticos
- [ ] **Editor: bullet points rotos** — `@editorjs/list` v2 cambió formato de datos (`items: string[]` → `items: [{ content, items }]`). Afecta renderer, tipos y CSS. Ver plan: `docs/plans/2026-04-29-editor-list-fix.md`

#### 🗂️ Storage de archivos
- [ ] **Storage provider abstraction** — Arquitectura Clean con `IStorageProvider` interface + `CloudinaryStorageProvider` (free tier) + `LocalStorageProvider` (dev). Ver plan: `docs/plans/2026-04-29-storage-provider.md`
- [ ] Wiring del storage al editor de imágenes (reemplazar blob URLs temporales)
- [ ] Avatar de usuario en perfil (upload real)

#### 🔐 Auth
- [ ] Login / register pages completas (Better Auth ya instalado)
- [ ] Google OAuth provider
- [ ] Sesión persistente en el cliente (Zustand ← Better Auth session)
- [ ] Protección de rutas server-side (middleware)

#### 📬 Social (Basics)
- [ ] Invitaciones a grupos por email
- [ ] Notificaciones in-app (alguien reviewó algo que viste)
- [ ] Feed de actividad del grupo
- [ ] Búsqueda de usuarios por username

#### 🤝 Social v2 — Engagement & Discovery

> **Orden de ejecución obligatorio.** Las features tienen dependencias entre sí.
> El número indica el orden. Features con el mismo número pueden hacerse en paralelo.

```
① F1+F2 (Reactions) ─────────┐
                              ├──→ ③ F3 (Reviewer Reputation)
② F4   (Follow System) ──────┤
                              └──→ ④ F6 (Social Feed & Global)
② F5   (Similar Content) ──────── (independiente, en paralelo con F4)
```

| Orden | Feature | DB Impact | Plan |
|:-----:|---------|-----------|------|
| ① | **Reactions en Reviews** (like/dislike) | Nueva tabla `ReviewReaction` | [`2026-04-29-reactions.md`](plans/2026-04-29-reactions.md) |
| ① | **Reactions en Comentarios** | Nueva tabla `CommentReaction` | Mismo plan ↑ |
| ② | **Follow System** | Nueva tabla `UserFollow` | [`2026-04-29-follow-system.md`](plans/2026-04-29-follow-system.md) |
| ② | **Contenido Similar** | Sin cambios en DB (TMDB API) | [`2026-04-29-similar-content.md`](plans/2026-04-29-similar-content.md) |
| ③ | **Reviewer Reputation** | Sin tabla nueva (datos derivados) | [`2026-04-29-reviewer-reputation.md`](plans/2026-04-29-reviewer-reputation.md) |
| ④ | **Social Feed & Reseñas Globales** | Sin tabla nueva (queries + joins) | [`2026-04-29-social-feed.md`](plans/2026-04-29-social-feed.md) |

**Dependencias concretas:**
- F3 (Reputation) requiere F1+F2 (calcula puntajes a partir de reacciones)
- F6 (Feed) requiere F4 (el feed de "seguidos" necesita la tabla `UserFollow`)
- F5 (Similar Content) es 100% independiente — puede ejecutarse en cualquier momento

#### 🎨 Polish & QA
- [ ] Loading states y error states en todos los flujos
- [ ] Responsive design completo (mobile first)
- [ ] Accesibilidad básica (aria labels, keyboard nav)
- [ ] Performance audit (Lighthouse > 90)
- [ ] 100% de textos en EN/ES (revisar keys faltantes)

#### 📊 Observabilidad (cuando se despliegue)
- [ ] Datadog RUM (frontend errors + Core Web Vitals)
- [ ] Datadog APM (latencia API + queries lentas)

---

## Fase 3 — Multi-contenido

**Objetivo:** Expandir más allá de películas y series.  
**Requisito previo:** Fase 2 estable.

### Providers ya preparados (sin UI)

| Contenido | Provider | API Key requerida | Estado |
|---|---|---|---|
| Libros | OpenLibrary | No | ✅ Provider creado |
| Libros | Google Books | Sí (`GOOGLE_BOOKS_API_KEY`) | ✅ Provider creado |
| Videojuegos | RAWG | Sí (`RAWG_API_KEY`) | ✅ Provider creado |
| Música | MusicBrainz | No | ✅ Provider creado |
| Música | Last.fm | Sí (`LASTFM_API_KEY`) | ✅ Provider creado |
| Podcasts | iTunes Search | No | ✅ Provider creado |

### Features de la plataforma

- [ ] UI para catálogo de libros (provider listo, falta página)
- [ ] UI para catálogo de videojuegos (provider listo, falta página)
- [ ] UI para catálogo de música (provider listo, falta página)
- [ ] Listas personalizadas ("Top 10 de Terror", "Pendientes 2025")
- [ ] Recomendaciones basadas en gustos del grupo
- [ ] Exportar reviews (PDF, CSV)
- [ ] Widgets embebibles para blogs/portfolios
- [ ] API pública documentada (OpenAPI/Swagger)

---

## Métricas de éxito

### Fase 2
- Auth completa: registro < 2 min, Google OAuth funciona
- Storage: imágenes persisten entre sesiones, cambiar proveedor = 1 línea
- Editor: bullet points, listas ordenadas y nested lists funcionan correctamente
- Lighthouse performance score > 90

### Fase 3
- El sistema soporta al menos 3 tipos de contenido con UI completa
- API pública documentada con OpenAPI/Swagger

---

## Dependencias y riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| TMDB API rate limiting | Alto | TanStack Query cachea; `next: { revalidate }` en Server Components |
| Cloudinary free tier límites | Medio | 25GB/mes es suficiente para MVP; arquitectura permite cambiar de proveedor |
| TMDB/Cloudinary cambian términos | Medio | Abstraídos detrás de interfaces — cambiar provider = nueva clase |
| Better Auth breaking changes | Bajo | Versión fija en package.json; actualizar en Fase 3 |
