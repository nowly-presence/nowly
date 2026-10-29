# @nowly/locales

Locale definitions, routing and translation catalogs for Nowly.

## Translation files

- `messages/shared/<locale>.json`: navbar, footer, theme and extension-store labels used by both web and docs.
- `messages/web/<locale>.json`: website-specific text.
- `messages/docs/<locale>.json`: documentation-interface text.

Each catalog contains all 11 supported locales. Shared namespaces must not appear in app catalogs. Cookie banners stay app-specific because their consent behavior differs. Extension translations remain in `apps/extension/messages`; documentation content remains in MDX.

To change shared UI copy, edit the shared JSON files once. Shared components use `useTranslations` or `getTranslations` directly; their app wrappers do not pass translated labels.

## Loading messages

App request configurations use `loadWebMessages` from `@nowly/locales/messages/web` or `loadDocsMessages` from `@nowly/locales/messages/docs`. Each loader combines its app catalog with the shared catalog and recursively falls back to English. Arrays are replaced, not merged by index.

Catalog registries use explicit `() => import("...")` entries, loading only the requested locale and English fallback in parallel. This is the exception to the project's static-import rule; keep paths literal so Next.js can analyze them. Keep loaders out of client modules and import each app's loader from its direct subpath: the website must not load the docs catalog, or vice versa. Only the selected locale's merged messages are passed to next-intl.

When adding a locale, update the locale definitions and all three `src/catalogs-*.ts` registries alongside the JSON files.

## Checks

```sh
pnpm --filter @nowly/locales typecheck
node --experimental-strip-types scripts/check-i18n-unused.ts
pnpm --filter @nowly/web exec vitest run i18n/messages.test.ts
```

The unused-key checker accounts for shared keys used by either app. Tests verify locale key parity, shared namespace deduplication, app isolation and recursive fallback.
