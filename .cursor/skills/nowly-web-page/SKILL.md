---
name: nowly-web-page
description: Builds Nowly marketing pages on nowly.me (apps/web) with the current design system. Use when adding or rewriting a public Next.js page such as library, support, desktop, canary, changelog, legal, or any new route that must match the existing DA in one pass.
---

# Nowly web page

Scope: `apps/web` only. Docs (`apps/docs`) shares the same floating navbar (lockup, Docs, Library, store button) but keeps its own sidebar and MDX chrome. Do not invent a third top bar.

Goal: ship a complete page in one pass (route, view, i18n EN/FR/ES, SEO, sitemap if public). Do not invent extra routes the user did not ask for.

Reference pages: [library-view.tsx](apps/web/components/library/library-view.tsx), [support-view.tsx](apps/web/components/support/support-view.tsx), [changelog-view.tsx](apps/web/components/changelog/changelog-view.tsx). Copy-paste shells live in [reference.md](reference.md).

## File split

| File | Role |
|------|------|
| `app/<route>/page.tsx` | RSC only: `generateMetadata`, `WebPageJsonLd`, fetch, render the view |
| `components/<feature>/<feature>-view.tsx` | Layout and UI. RSC if static; `"use client"` only for state, effects, or browser APIs |
| `messages/{en-US,fr-FR,es-ES}.json` | All user-facing strings, three locales in the same PR |

Do not put fetch + giant JSX in `page.tsx`. Library is the model: thin page, fat view.

## Page shell

Every inner page (not the home hero) uses this rhythm:

```tsx
<div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
  <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
    <header className="max-w-xl">
      <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
        {t("eyebrow")}
      </p>
      <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
        {t("description")}
      </p>
    </header>
    {/* content */}
  </div>
</div>
```

- Width: `max-w-7xl` + `px-5 sm:px-10`. Do not invent a third container.
- Header copy width: `max-w-xl` (or `max-w-160` if the title is long).
- Vertical space before content: `mt-12` or `mt-14`, not random `mt-7`.
- Alternate bands on the home page only: `bg-section-alt` via existing home helpers. Inner pages stay on `background`.
- Cards: `rounded-[16px]`, `Card` from `@nowly/ui`. Clickable card: wrap with `Link` or `<a className="block rounded-[16px] outline-offset-4">`, never `Button render={Link}`.
- Grids: `gap-4 sm:grid-cols-2 lg:grid-cols-3` unless the reference page does otherwise.

Do **not** reuse library `useNavJoin` / `data-nav-join` unless the page has a sticky toolbar that must fuse with the marketing navbar. That hook is library-specific.

## Typography and color

Tokens live in `apps/web/app/globals.css`. Use them; do not hardcode new hexes.

| Role | Class / token |
|------|----------------|
| Page bg | `bg-background` (`#eef5fc` light, `#07080c` dark) |
| Ink | `text-foreground` |
| Secondary copy | `text-foreground/68` or `text-muted-foreground` |
| Accent / eyebrow | `text-accent` (`#0891B2` light, `#22D3EE` dark) |
| Font | Satoshi via `font-sans` (already on `body`) |
| Headings | `font-medium`, tight tracking, not `font-bold` on H1 |
| Icons | `@remixicon/react` (`Ri*Line` / fills for brands). No Tabler, no lucide |

Light/dark is `next-themes` on `<html class="dark">`. Prefer `bg-card`, `border-border`, `text-accent`. Test both if the layout depends on contrast (lockup is handled by `BrandLockup`).

## Copy

- Locales: `en-US`, `fr-FR`, `es-ES`. Same keys, three files.
- Metadata: `pages.<route>.title` + `pages.<route>.description` (used by `generateMetadata`).
- UI: a dedicated namespace (`libraryPage`, `supportPage`, `changelogPage`, …).
- Never **Host** in user copy. EN: Desktop app. FR: Application bureau. ES: App de escritorio. Mention Host only when explaining the rename.
- No em dashes. No middle dots (`·`). Hyphen or period instead.
- No leftover marketing sections the user did not ask for.

## Links and buttons

- Navigation: real `Link` or `<a>`. Styled with `ButtonLink` / `ButtonAnchor` from `@nowly/ui`.
- Never `Button` + `render={<Link />}` / `asChild` / `nativeButton={false}`.
- Never call `buttonVariants()` in an RSC. The wrapper is a Client Component.
- `<Button>` only for `type="button"` / `submit`.
- Variants: `default`, `outline`, `secondary`, `ghost`, `inverted`, `dark`, `soft`. Sizes: `default`, `sm`, `lg`, `icon`.
- Internal docs URLs: `docsHref("/getting-started/installation")` from `@/lib/seo`. Canonical marketing origin is `https://nowly.me`. Never reference `dev.nowly.me` in SEO.

## SEO (every public page)

In `page.tsx`:

```tsx
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.<route>")
  return createMetadata({ title: t("title"), description: t("description"), path: "/<route>" })
}
```

Also render `<WebPageJsonLd name={...} description={...} path="/<route>" />`.

If the route is public and indexable, add it to `apps/web/app/sitemap.ts`. Footer / navbar links only if the user asked for discovery.

## Data

- Independent fetches: `Promise.all`.
- Catalog / API: existing helpers (`getPresenceCatalog`, `getDesktopRelease`, …). Do not add a new client fetch waterfall if the page can be RSC.
- `"use client"` views receive already-fetched props.

## Checklist (must all pass)

- [ ] Thin `page.tsx` + view component
- [ ] Shell + header classes match the recipe
- [ ] EN/FR/ES keys for metadata and UI
- [ ] `createMetadata` + `WebPageJsonLd` + sitemap if public
- [ ] Links via `ButtonLink` / `ButtonAnchor` / plain `Link`
- [ ] Remixicon only
- [ ] No Host, no em dash, no middle dot
- [ ] No extra sections
- [ ] `pnpm` (never npm)
- [ ] Browser pass on the new route (desktop + a tight viewport if layout is responsive)
