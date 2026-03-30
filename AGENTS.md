<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:i18n-rules -->
# Internationalization (i18n) — MANDATORY

This app uses `next-intl` v4 for full EN/ES support. **ALL UI text must go through the translation system.**

## Rules

- **NEVER hardcode user-visible text** in components. Use `useTranslations()` always.
- Translation files: `messages/en.json` and `messages/es.json`. If a key is missing, **add it to both files**.
- Locale is stored in a cookie (`NEXT_LOCALE`), NOT in the URL. No `/en/` or `/es/` prefixes.
- Use `useTranslations('namespace')` from `next-intl` in Client Components.
- For Server Components, use `getTranslations('namespace')` (async).
- Plural forms use ICU syntax: `"{count, plural, one {# item} other {# items}}"`.

## Namespace Map

| Feature | Namespace |
|---------|-----------|
| Navigation | `nav` |
| Common actions (save, cancel, delete…) | `common` |
| Content types (movie, series…) | `contentType` |
| Consumption status | `status` |
| Dashboard | `dashboard` |
| Catalog | `catalog` |
| Reviews | `reviews` |
| Watchlist | `watchlist` |
| Groups | `groups` |
| Profile | `profile` |
| Onboarding | `onboarding` |
| Theme | `theme` |
| Language | `language` |
| User menu | `user` |

## Pattern

```tsx
// ✅ Correct
const t = useTranslations('groups')
<h1>{t('title')}</h1>
<span>{t('card.memberCount', { count: n })}</span>

// ❌ Wrong
<h1>Groups</h1>
```
<!-- END:i18n-rules -->
