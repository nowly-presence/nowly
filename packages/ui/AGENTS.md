# @nowly/ui

Shared React components for `apps/web` and `apps/docs`. shadcn-style primitives are one file each in `src/*.tsx`, re-exported from `src/index.ts`; `src/icons.ts` is not in the barrel and is imported as `@nowly/ui/icons`. `footer.tsx`, `locale-flag.tsx` and `locale-selector.tsx` live here so they render identically across apps. Other subpaths are listed in `package.json` `exports`.

## Add a footer link

Links are hardcoded in `src/footer.tsx` (no props) so web and docs cannot diverge. Never add a link in one app's wrapper; if it only fits one app, it does not belong in the shared footer. Do these together:

1. Add the label to `FooterLabels` (line ~22), e.g. `newThing: string`.
2. Add the link to one of the four `columns` (product, resources, community, company) or to `legalLinks` (~line 177). Use `web(path)` for nowly.me, `docs()` for the docs home, or a raw URL with `external: true`.
3. Add the key (kebab-case, e.g. `"new-thing"`) to the `footer` namespace in all 11 locale files of both `apps/web/messages/*.json` and `apps/docs/messages/*.json`.
4. Add `newThing: t("new-thing")` to the `labels` passed to `<SharedFooter>` in `apps/web/features/layout/components/footer.tsx` and `apps/docs/features/layout/components/footer.tsx`.
5. Run `tsc --noEmit` (or build) for web and docs: a missing label is a type error.

Do not add `columns`/`links` props to `Footer` or `LocaleSelector`.

## Add a component

1. Create `src/<name>.tsx` and add `export * from "./<name>";` to `src/index.ts`.
2. `next-intl` and `@nowly/locales` are already dependencies.

Note: `apps/insights` imports the barrel, which includes `locale-selector` (so `next-intl` and `@nowly/locales`), yet its `transpilePackages` lacks `@nowly/locales`; keep that in mind if resolution errors appear there.

## Gotchas

- After adding a dependency: `pnpm install`, make sure the consuming app's `next.config.ts` `transpilePackages` includes `@nowly/ui`, then `rm -rf apps/<app>/.next` and restart (stale Turbopack resolution gives a false "Module not found").
- `localizedUrl` in `footer.tsx` duplicates the apps' locale prefix scheme (short codes, default unprefixed) on purpose; keep it in sync with `packages/locales`.
- Adding a locale also touches `localeLabelKey` (`locale-selector.tsx`) and `otherFlags` (`locale-flag.tsx`); see `packages/locales/AGENTS.md`.
