# @nowly/locales

Centralized `next-intl` configuration shared by `apps/web` and `apps/docs`: `routing.ts` (locales + URL prefix mode), `navigation.ts` (typed `Link`/`redirect`/`usePathname`/`useRouter`), `proxy.ts` (the middleware), `request.ts` (takes each app's message loader as a parameter).

## Add a new supported locale

1. In `src/index.ts`, add the new code to `SUPPORTED_LOCALES` (line 4), and add its short URL prefix to `LOCALE_SHORT_MAP` and `LOCALE_LONG_MAP` (both around line 29-54) — this is the single source of truth `LocaleString` is derived from.
2. `routing.ts`'s `appRouting` derives its `prefixes` from `LOCALE_SHORT_MAP` automatically — no change needed there.
3. Add a new `messages/<locale>.json` in **both** `apps/web` and `apps/docs`, with every key from `en-US.json` translated (missing keys throw `next-intl`'s `MISSING_MESSAGE` in dev, or silently fall back to English in docs via its `withEnglishFallback` wrapper — don't rely on that for web, it doesn't have one).
4. Add the locale's label to `packages/ui/src/locale-selector.tsx`'s `localeLabelKey` map, and to the `footer` namespace's language names (`english`, `french`, ...) in both apps' message files.
5. If the locale needs a custom flag rendering, add a case in `packages/ui/src/locale-flag.tsx`'s `otherFlags` map — otherwise it falls back to a generic flag.

## Gotchas

- `apps/*/i18n/{routing,navigation,request}.ts` and `apps/*/proxy.ts` must stay one-line re-exports from `@nowly/locales/*`. Don't inline config there — that's exactly the duplication this package exists to remove.
- In `proxy.ts` (both here and in each app's own `proxy.ts`), export the proxy function directly:
  ```ts
  import { appProxy } from "@nowly/locales/proxy";
  export default appProxy;
  ```
  not `export { appProxy as default } from "..."` — that re-export form has made Next.js's build-time analyzer fail to detect a valid proxy export (`"The file ./proxy.ts must export a function"`), even though the code is otherwise correct.
- After changing anything imported cross-package here, if either app's dev server reports `Module not found: Can't resolve '@nowly/locales'`, run `pnpm install`, confirm `"@nowly/locales"` is in that app's `next.config.ts` `transpilePackages`, then `rm -rf apps/<app>/.next` and restart — it's a stale Turbopack resolution cache, not a real missing dependency.

## Notable dependencies
`next-intl`. Consumed by `apps/web` and `apps/docs`.
