# @nowly/ui

Shared React component library used by `apps/web`, `apps/docs` and `apps/insights`. shadcn-style primitives live directly in `src/*.tsx` (one file per component, all re-exported from `src/index.ts`). A handful of business components that must render *identically* across apps also live here: `footer.tsx`, `locale-flag.tsx`, `locale-selector.tsx`.

## Add a link to the footer

The footer's link structure is hardcoded in `src/footer.tsx` (not passed as props) so `apps/web` and `apps/docs` can never render different links. To add one:

1. Open `packages/ui/src/footer.tsx`.
2. Add the label to the `FooterLabels` type (around line 20) — e.g. `newThing: string`.
3. Add the link itself inside the `columns` array (one of the three `{ title, links }` objects) or, if it's a legal page, inside `legalLinks` (around line 95). Use the `web(path)` helper for a page on nowly.me, `docs()` for the docs home, or a raw URL + `external: true` for anything off-domain:
   ```ts
   { href: web("/new-page"), label: labels.newThing }
   ```
4. Add the translation key in **both** apps' `footer` namespace, in all 11 locale files: `apps/web/messages/*.json` and `apps/docs/messages/*.json` (`de-DE`, `el-GR`, `en-US`, `es-ES`, `fr-FR`, `ja-JP`, `ko-KR`, `ms-MY`, `pl-PL`, `pt-BR`, `tr-TR`). Key name in kebab-case, e.g. `"new-thing": "New thing"`.
5. Wire the label in both apps' footer wrapper — `apps/web/features/layout/components/footer.tsx` and `apps/docs/features/layout/components/footer.tsx` — by adding `newThing: t("new-thing"),` to the `labels={{ ... }}` object passed to `<SharedFooter>`.
6. Run `pnpm --filter @nowly/web build` and `pnpm --filter @nowly/docs build` (or at least `tsc --noEmit` on both) — a missing label on either side is a type error, not a silent bug.

Never add the link only in one app's footer wrapper — there is nowhere to put an app-specific link, that's the point of this component. If a link genuinely only makes sense on one app, it doesn't belong in the shared footer.

## Add a new shared component

1. Create `src/<name>.tsx`.
2. Add `export * from "./<name>";` to `src/index.ts`.
3. If it needs `next-intl` or `@nowly/locales` (like `locale-selector.tsx` does), import directly — both are already declared as dependencies in `package.json`.

## Gotchas

- After adding a new dependency to `packages/ui/package.json`, run `pnpm install`, then add `"@nowly/ui"` to the consuming app's `next.config.ts` `transpilePackages` if it isn't already there, then `rm -rf apps/<app>/.next` and restart the dev server — Turbopack caches module resolution and will report a false "Module not found" otherwise.
- `Footer`/`LocaleSelector` take almost no layout props on purpose. If you're tempted to add a `columns` or `links` prop to `Footer`, don't — that reopens the door to per-app divergence this component exists to close.

## Notable dependencies
`@nowly/locales` (i18n routing for `LocaleSelector`/`Footer`), `next-intl`, `@base-ui/react`, `class-variance-authority`.
