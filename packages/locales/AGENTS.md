# @nowly/locales

Single next-intl config for web, docs, API, extension and `packages/ui`. `SUPPORTED_LOCALES` (`src/index.ts`) is the source of truth. Check with `pnpm --filter @nowly/locales typecheck` (no tests).

## Add a locale

1. `src/index.ts`: add it to `SUPPORTED_LOCALES`, its short code to `LocaleShort`, and entries to `LOCALE_SHORT_MAP` and `LOCALE_LONG_MAP`.
2. Add `<locale>.json` to `messages/{shared,web,docs}` and register its literal `() => import("...")` loader in each `src/catalogs-*.ts`.
3. Extension: add `apps/extension/messages/<short>.json` and update `UI_LOCALES` and `LOCALE_LONG_MAP` in `apps/extension/src/shared/locales.ts`.
4. `packages/ui`: `localeLabelKey` (`locale-selector.tsx`), the language name in the shared `footer` namespace, and a case in `otherFlags` (`locale-flag.tsx`) if it needs a custom flag.
5. Optional content (falls back to `en-US`): `packages/changelog/content/*/<locale>.mdx`, docs `content/**/<locale>.mdx`.

## Rules

- `messages/shared` owns navbar, footer, theme and store strings; app catalogs never duplicate those namespaces. App catalogs merge recursively over English and replace arrays whole.
- Apps call `createRequestConfig` with `loadWebMessages` or `loadDocsMessages` imported from their direct subpath, so one app never loads the other's catalog.
- Dynamic imports only as lazy loader functions with literal paths in the catalog registries, never eagerly created promises.
- App `i18n/{routing,navigation}.ts` and `proxy.ts` stay thin re-exports. A proxy imports then default-exports (`import { appProxy } from "@nowly/locales/proxy"; export default appProxy;`), never `export { appProxy as default }` (breaks Next), and exports its own `config` matcher.
- `Can't resolve '@nowly/locales'` in dev: `pnpm install`, check the app's `transpilePackages`, delete `apps/<app>/.next`, restart.
