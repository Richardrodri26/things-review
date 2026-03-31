# Skill Registry — things-review

This file is a registry of all available skills for the `things-review` project. It is automatically managed by `sdd-init`.

## Compact Rules

### i18n
- **MANDATORY**: Use `next-intl` v4.
- **NEVER hardcode user-visible text**. Use `useTranslations()` in Client Components or `getTranslations()` in Server Components.
- Translation files are at `messages/en.json` and `messages/es.json`.
- Add missing keys to BOTH files.
- Locale is in `NEXT_LOCALE` cookie.

### Tech Stack
- **Framework**: Next.js 16.2 (breaking changes, check `node_modules/next/dist/docs/`).
- **ORM**: Prisma 7.6.
- **Auth**: Better Auth.
- **UI**: Shadcn, Sileo (coss).
- **Styles**: Tailwind CSS 4.
- **State**: Zustand 5, TanStack Query 5.
- **Validation**: Zod 4.

## User Skills Trigger Table

| Context | Skill |
|---------|-------|
| UI, components, pages, layouts | `frontend-design` |
| React components, hooks, JSX | `react-19` |
| Routes, Server Components, Actions, Fetching | `nextjs-15` |
| Types, interfaces, generics, DTOs | `typescript` |
| Tailwind classes, theme, tokens | `tailwind-4` |
| Zod schema, validation | `zod-4` |
| Zustand store, slice | `zustand-5` |
| shadcn components | `shadcn` |
| Sileo components (coss) | `coss` |
| E2E Tests | `playwright` |
| Planning new features | `writing-plans` |
| Executing plans | `executing-plans` |
| Bugs or unexpected behavior | `systematic-debugging` |
| React/Next.js performance review | `vercel-react-best-practices` |
| Finishing React changes | `react-doctor` |

## Project Standards

See `AGENTS.md` and `docs/skills.md` for full context.
