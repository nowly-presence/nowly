# Content

Long-form text that lives in files, not in `messages/*.json` (messages ship to the browser on every page, so they stay short). Used by `features/guides` (`content/guides`), the optional presence guides of `features/library` (`content/presences`) and the release notes of `features/changelog` (`packages/changelog`).

## Files

- General guides: `content/guides/<slug>/<locale>.md`, one file per locale. 15 guides exist: 12 in all 11 locales, and `create-custom-discord-activity`, `custom-activity-images`, `share-custom-activities` in `en-US` and `fr-FR` only (others fall back to English, see `features/guides`). When changing a guide, update every locale file it has.
- Presence guides: `content/presences/<slug>/<locale>.md`. The folder is currently absent, so none are published. Archived originals are in `presence-guides-backup/apps/web/content/presences` at the repo root; copying that folder into `apps/web/content/` republishes them with no code change. Presence pages still carry no ads.
- Frontmatter: `key: value` lines between `---` fences, plain strings only (`lib/frontmatter.ts`). Quote values that start with a quote.
- Files are read at request time with `node:fs` from `process.cwd()` (`lib/content-files.ts`, server-only); the Dockerfile runs `next start` from `apps/web`.

## Markdown subset (`lib/markdown.ts`)

`##` and `###` headings (ids feed `components/content-toc.tsx`), paragraphs, `-` and `1.` lists (one level; indented lines continue an item), `>` notes, fenced code, pipe tables, `**bold**`, `` `code` `` and `[links](href)`. Links starting with `/` use next-intl's `Link` and keep the reader's locale. Anything else (MDX components, `import`, raw HTML, `####`) is skipped or shown as text, never rendered as HTML.

French files get no-break spaces before `? ! : ; »` and after `«` automatically (`frenchSpacing`, code excluded): write normal spaces.

Screenshots: a standalone line `![Alt text](https://images.nowly.me/guides-screenshots/<guide>/<file>.png "Optional caption")` with a blank line before and after. Only HTTPS images on `images.nowly.me` or `cdn.nowly.me`, without credentials or custom ports, render. They lazy-load, keep their aspect ratio and link to the full file. Don't publish placeholder URLs; add image lines after upload. Custom-activity screenshots use the English development preview with simulated data: say so in the guide, never present it as a real Discord connection.

## Writing rules

- Write only what the code or product really does. Check labels against `apps/extension/messages/*.json` and presence settings against the presences repository (`packages/presences` when cloned).
- Use each language's exact UI labels in bold.
- No em or en dashes. Keep `updated` (YYYY-MM-DD) current when the text changes.
