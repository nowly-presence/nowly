# Content

Long-form text that lives in files, not in `messages/*.json` (messages are sent to the browser on every page, so they stay short). Used by `features/guides` (`content/guides`), the optional presence guides of `features/library` (`content/presences`), and the full release notes of `features/changelog` (`packages/changelog`). No presence-specific guides are currently published; their original files are preserved at the repository root in `presence-guides-backup/apps/web/content/presences`.

## Files

- General guides: `apps/web/content/guides/<slug>/<locale>.md`, one file per locale. All 12 guides are translated into all 11 supported locales; keep every locale's copy current when changing a guide.
- Presence guides: `apps/web/content/presences/<slug>/<locale>.md` when present. To republish the archived guides without changing code, copy `presence-guides-backup/apps/web/content/presences` into `apps/web/content/`; the loader, folded rendering and guide-aware indexing remain available. Presence pages still have no ad placement.
- Frontmatter: `key: value` lines between `---` fences, plain strings only (`lib/frontmatter.ts`). Quote a value that starts with a quote or needs one.
- Read at request time with `node:fs` from `process.cwd()` (the Dockerfile runs `next start` from `apps/web`, like `apps/docs` does for its MDX).

## Markdown subset (`lib/markdown.ts`)

`##` and `###` headings (ids generated, used by `components/content-toc.tsx`), paragraphs, `-` and `1.` lists (one level, indented lines continue an item), `>` notes, fenced code blocks, pipe tables, `**bold**`, `` `code` `` and `[links](href)`. Links starting with `/` go through next-intl's `Link`, so they keep the reader's locale. Anything else (MDX components, `import`, raw HTML, `####`) is skipped or shown as text, never rendered as HTML.

French files get no-break spaces before `? ! : ; »` and after `«` automatically (`frenchSpacing`), code excluded: write normal spaces.

Guide screenshots use a standalone `![Descriptive alt text](https://images.nowly.me/guides-screenshots/custom-activities/03-editor-preview.png "Optional caption")` line. Only HTTPS images hosted on `images.nowly.me` or `cdn.nowly.me`, without credentials or custom ports, are rendered. Images load lazily in the browser, preserve their natural aspect ratio and link to the full-resolution file. Keep a blank line before and after. Do not publish placeholder CDN URLs; add the image lines only after upload. Custom activity screenshots use the English development preview with stable Nowly branding and simulated data; explain this in the guide, not as proof of a real Discord connection.

## Writing rules

- Only write what the code or the product really does. Check labels against `apps/extension/messages/*.json` and presence settings against `packages/presences`.
- Use the exact UI labels of each language in bold.
- No em dash or en dash. Keep `updated` (YYYY-MM-DD) current when the text changes.
