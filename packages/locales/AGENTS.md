# @nowly/locales

Central `next-intl` config. `src/index.ts` holds locale codes and maps (`SUPPORTED_LOCALES` is the source of truth), `routing.ts` (prefixes), `navigation.ts` (typed `Link`/`redirect`/hooks), `proxy.ts` (`appProxy`), `request.ts` (`createRequestConfig(loadMessages)`). Consumed by `apps/web`, `apps/docs`, `apps/api`, `apps/extension` and `packages/ui`. No test script; check with `pnpm --filter @nowly/locales typecheck`.

## Add a locale

1. `src/index.ts`: add the code to `SUPPORTED_LOCALES`, its short code to the hand-written `LocaleShort` union, and entries in `LOCALE_SHORT_MAP` and `LOCALE_LONG_MAP`. The typed records only force compile errors; the list is the truth. `routing.ts` derives prefixes automatically.
2. Add `<locale>.json` to `packages/locales/messages/{shared,web,docs}` and register its literal `() => import("...")` loader in each `src/catalogs-*.ts`. Shared catalogs own navbar, footer, theme and store. App catalogs must not duplicate shared namespaces. Both app loaders merge recursively over English, replacing arrays as complete values.
3. Add `apps/extension/messages/<short>.json` (short code, e.g. `pt-BR`, `ja`) and update `apps/extension/src/shared/locales.ts` (`UI_LOCALES`, `LOCALE_LONG_MAP`).
4. `packages/ui`: `localeLabelKey` in `locale-selector.tsx`, plus the language name in the `footer` namespace of both apps' messages. Add a case to `otherFlags` in `locale-flag.tsx` if it needs a custom flag.
5. Optional translated content: `packages/changelog/content/*/<locale>.mdx` and docs `content/**/<locale>.mdx` (both fall back to `en-US`).

## Gotchas

- App `i18n/request.ts` files call `createRequestConfig` with `loadWebMessages` or `loadDocsMessages`. Import these from their direct package subpaths so one app never loads the other's catalog. Dynamic imports are allowed only in catalog registries as explicit lazy loader functions with literal paths, never as eagerly initialized promises. Shared components resolve their own translations instead of receiving label props.
- Each app's `i18n/{routing,navigation}.ts` and `proxy.ts` should stay thin re-exports of `@nowly/locales/*`; each proxy also exports a `config` matcher.
- Proxy must import then default-export, never `export { appProxy as default } from ...` (breaks Next's "must export a function" analysis):
  ```ts
  import { appProxy } from "@nowly/locales/proxy";
  export default appProxy;
  ```
- `Module not found: Can't resolve '@nowly/locales'` in dev: `pnpm install`, confirm `@nowly/locales` is in the app's `transpilePackages`, `rm -rf apps/<app>/.next`, restart.
