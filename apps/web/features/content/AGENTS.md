# Content

Long-form text lives in files, not in `messages/*.json` (messages ship to the browser on every page): guides (`content/guides`), optional presence guides (`content/presences`) and release notes (`packages/changelog`).

## Files

- One file per locale: `content/guides/<slug>/<locale>.md`. Some guides exist only in `en-US` and `fr-FR` (others fall back to English). When changing a guide, update every locale file it has.
- `content/presences/<slug>/<locale>.md` does not exist yet, so no presence guide is published; adding files there publishes them with no code change.
- Frontmatter: `key: value` lines between `---` fences, plain strings only; quote values that start with a quote.
- Files are read at request time from `process.cwd()` (server-only); the Dockerfile runs `next start` from `apps/web`.

## Markdown subset (`lib/markdown.ts`)

- Supported: `##` and `###` headings, paragraphs, one-level `-` and `1.` lists, `>` notes, fenced code, pipe tables, `**bold**`, inline code and `[links](href)`. Links starting with `/` keep the reader's locale. Anything else (MDX, `import`, raw HTML, `####`) is skipped or shown as text.
- French: write normal spaces; no-break spaces before `? ! : ; »` and after `«` are added automatically.
- Screenshots: a standalone `![Alt](https://images.nowly.me/guides-screenshots/<guide>/<file>.png "Caption")` line with blank lines around it. Only HTTPS images on `images.nowly.me` or `cdn.nowly.me` render. Add the line after the upload, never a placeholder URL.

## Writing rules

- Describe only what the product really does: check labels against `apps/extension/messages/*.json` and presence settings against the presences repository.
- Use each language's exact UI labels, in bold.
- No em or en dashes. Update `updated` (`YYYY-MM-DD`) when the text changes.
- Custom activity screenshots come from the English development preview with simulated data: say so, never present them as a real Discord connection.
