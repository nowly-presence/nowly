# Extension announcements

## Deploy

Announcements require PostgreSQL. Apply the additive migration `20261024120000_add_announcements`, generate the Prisma client, then deploy the API and extension. The existing API Docker image includes `packages/changelog/content` and runs `migrate-deploy.sh` before starting. Custom trimmed images must also include that content directory at `/app/packages/changelog/content`; absent content produces no release entries. No migration or database mutation is performed by the unit tests.

Set `API_SECRET_KEY` on the server using the existing secret-management process. Publication uses the existing `hasAdminAuth`, not the development-bypassing `requireAuth`. Missing configuration, missing credentials and incorrect credentials always receive `401`, including development. Never put the key in an extension build, browser request, screenshot, source file or request log. There is no admin UI.

## Publish

`POST /announcements` publishes immediately unless `startsAt` is in the future. Dates are ISO 8601 timestamps with a timezone. At least one translation is required; title and description are required per translation, content is optional. Supported keys match the interface locales: `en`, `fr`, `es`, `de`, `pt-BR`, `pl`, `ja`, `ko`, `tr`, `ms`, `el`. Unknown keys and empty translation maps are rejected. The extension chooses its UI language, then English, then the first available language in the preceding deterministic order. English is not required and translations are not generated automatically.

Example with a placeholder only:

```sh
curl --request POST 'https://api.nowly.me/announcements' \
  --header 'Authorization: Bearer <API_SECRET_KEY_PLACEHOLDER>' \
  --header 'Content-Type: application/json' \
  --data '{
    "translations": {
      "en": {
        "title": "Library maintenance",
        "description": "Saved activities continue working while downloads are updated.",
        "content": "## Maintenance\n\nYour **saved activities** are unaffected.\n\n[Service status](https://nowly.me/status)"
      },
      "fr": {
        "title": "Maintenance de la bibliothèque",
        "description": "Les activités enregistrées continuent de fonctionner.",
        "content": "## Maintenance\n\nVos **activités enregistrées** ne sont pas affectées."
      }
    },
    "kind": "maintenance",
    "pinned": true,
    "startsAt": "2027-01-10T09:00:00Z",
    "endsAt": "2027-01-10T10:00:00Z"
  }'
```

Kinds: `normal`, `warning`, `maintenance`. Only warnings accept and require `severity`: `1`, `2` or `3`. Maintenance always uses the extension's primary theme token. Optional `pinned` defaults false. `startsAt`, `endsAt` and `expiresAt` default null; start must precede end and expiry, and end cannot follow expiry.

`endsAt` is an estimated end, never an automatic promise of service recovery. At and after that time it disappears from the homepage banner only. It remains persisted on the server and readable in Actualités (News) and its detail, including in newly fetched feeds and offline cached copies. Its detail retains the absolute estimated end date without a countdown or a claim that service has recovered. Reaching `endsAt` does not delete the announcement or change its stored `pinned` flag.

`expiresAt` is a separate, explicit feed expiry. At and after expiry the notice is excluded from the public feed, detail and banner, without deleting its database row. Omit expiry to keep a notice readable after its estimated end, as in the example above. For an indefinite banner omit both end and expiry. `startsAt` still schedules when the notice first becomes public. No edit/delete endpoints are included in this slice.

Limits: 160-character titles, 600-character descriptions, 20,000-character content per translation, 24,000 UTF-8 bytes for the full translation map, 128 KiB request body. Unknown fields, invalid types, date order and severity combinations receive `400`; oversized bodies receive `413` from Fastify. The server returns only explicit validated public fields. Future announcements and future, undated, draft or explicitly unpublished release notes are never included in public reads.

## Read and live updates

`GET /announcements?locale=en` is public and read-only. It returns `{ "items": [...] }` with up to 100 pinned-first, newest-first notices and published release notes. The locale controls release-note text. Announcements retain their optional translation maps for local fallback. The canonical English release frontmatter date controls publication for every language. A localized release marked `draft: true` or `published: false` is never exposed; the published canonical English text is returned instead, with the same canonical publication date. MDX is read as text, never compiled or executed. Only version-shaped directories under `packages/changelog/content` are read, not draft directories. Release markdown is converted to a nonexecuting extension subset: headings, paragraphs, lists, emphasis, code, quotes and HTTPS links. Raw HTML and MDX remain escaped text; images are rendered as alt text, with no remote image requests. Unsafe links and credential-bearing URLs are not linked.

`GET /announcements/events` is a public SSE invalidation stream with no announcement payload. Configure reverse proxies to disable buffering for this route. One process-wide poll runs every two seconds only while clients are connected, detecting other API instances and scheduled start/expiry changes through PostgreSQL. Publication also sends an immediate invalidation on its instance. Estimated-end banner transitions use the panel clock and work offline without waiting for another fetch or changing server data. Streams have 128-client, five-minute and 16 KiB buffered-output bounds, heartbeat comments, disconnect cleanup and server-shutdown cleanup. Multiple API replicas still converge through the two-second shared-database check.

The visible side panel owns the SSE connection, closes it on hiding/unmounting and fetches through the normal background message router. No permanent service-worker connection is used. Thirty-second panel polling and online/focus refresh remain available without SSE. A five-minute browser alarm and boot refresh recover missed updates across service-worker restarts. Requests omit credentials and referrers and reject redirects. Successful validated feeds persist locally; failures retain the last valid copy with an explicit stale/offline notice. Local date filtering still removes explicitly expired items offline, while estimated-end notices stay readable and only their banners disappear. Cached data is isolated by API endpoint. Read revisions remain on-device, bounded to 500, and are not account-synced or tracked by analytics.

The compact announcement strip sits above the app header only on the Activity root: onboarding is inactive, the selected tab is `activity` and the navigation stack is empty. It is not shown during onboarding, on other tabs or on any pushed route, including announcement details. The entire strip is one native link showing the notice title. Clicking it or pressing Enter selects the Actualités (News) feed through `setTab("announcements")`, not an individual detail route. It has no disclosure, expanded body, countdown or decorative border; keyboard focus remains visible, and its single navigation arrow inherits the text color. Normal notices use a neutral surface. Warning levels 1/2/3 use subtle yellow/orange/danger background tints, while maintenance uses the active theme's primary-soft tint, including seasonal primary overrides. Hover retains the corresponding tint rather than replacing every background with a generic primary color. Yellow/orange reuse existing Nowly seasonal palette values through centralized soft-background tokens; text stays ink-colored in every case. Maintenance is a separate kind, not warning severity 4. Navigation does not dismiss the notice or mark it read. Returning to Activity shows the strip again while the notice remains banner-eligible. There is no dismissal control for any kind; maintenance is nondismissible, old persisted dismissal records are discarded, and runtime dismissal requests are ignored. Feed rows reuse the extension's neutral Group/Row structure. Feed and detail metadata contains only dates in secondary text, with no kind/severity badges or metadata icons. Activity and Settings cannot be hidden; News can be hidden from Appearance settings without hiding the homepage notice strip.

## Local checks and preview

```sh
pnpm --filter @nowly/api lint
pnpm --filter @nowly/api test
pnpm --filter @nowly/extension lint
pnpm --filter @nowly/extension exec vitest run src/entrypoints/sidepanel/app-announcements.test.tsx src/shared/announcements.test.ts src/shared/announcements-live.test.ts src/background/services/announcements.test.ts src/features/announcements/announcements-markdown.test.tsx src/features/announcements/announcements-view.test.tsx src/shared/dock-layout.test.ts
pnpm --filter @nowly/extension preview
```

The preview includes a primary maintenance banner, three warning levels and a release-note example. Use `?view=announcements&season=none&lang=en` (or `lang=fr`) and `announcements=offline` for the saved-copy state. Preview notices are fixtures, not live publication. Production captures must use the built unpacked extension with a virtual screen (`launchvs`), not pass a preview screenshot off as a production connection.
