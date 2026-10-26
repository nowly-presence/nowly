# @nowly/locales

Central `next-intl` config. `src/index.ts` holds locale codes and maps (`SUPPORTED_LOCALES` is the source of truth), `routing.ts` (prefixes), `navigation.ts` (typed `Link`/`redirect`/hooks), `proxy.ts` (`appProxy`), `request.ts` (`createRequestConfig(loadMessages)`). Consumed by `apps/web`, `apps/docs`, `apps/api`, `apps/extension` and `packages/ui`. No test script; check with `pnpm --filter @nowly/locales typecheck`.

## Add a locale

1. `src/index.ts`: add the code to `SUPPORTED_LOCALES`, its short code to the hand-written `LocaleShort` union, and entries in `LOCALE_SHORT_MAP` and `LOCALE_LONG_MAP`. The typed records only force compile errors; the list is the truth. `routing.ts` derives prefixes automatically.
2. Add `messages/<locale>.json` (long code) to `apps/web` and `apps/docs`, with every `en-US.json` key. Web throws `MISSING_MESSAGE` on gaps; docs falls back to English through `withEnglishFallback` in `apps/docs/i18n/request.ts`.
3. Add `apps/extension/messages/<short>.json` (short code, e.g. `pt-BR`, `ja`) and update `apps/extension/src/shared/locales.ts` (`UI_LOCALES`, `LOCALE_LONG_MAP`).
4. `packages/ui`: `localeLabelKey` in `locale-selector.tsx`, plus the language name in the `footer` namespace of both apps' messages. Add a case to `otherFlags` in `locale-flag.tsx` if it needs a custom flag.
5. Optional translated content: `packages/changelog/content/*/<locale>.mdx` and docs `content/**/<locale>.mdx` (both fall back to `en-US`).

## Gotchas

- Each app's `i18n/{routing,navigation}.ts` and `proxy.ts` should stay thin re-exports of `@nowly/locales/*`. `apps/docs/i18n/request.ts` is the exception (it wraps the loader with English fallback), and each `proxy.ts` also exports a `config` matcher.
- Proxy must import then default-export, never `export { appProxy as default } from ...` (breaks Next's "must export a function" analysis):
  ```ts
  import { appProxy } from "@nowly/locales/proxy";
  export default appProxy;
  ```
- `Module not found: Can't resolve '@nowly/locales'` in dev: `pnpm install`, confirm `@nowly/locales` is in the app's `transpilePackages`, `rm -rf apps/<app>/.next`, restart.
