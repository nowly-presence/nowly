# Nowly monorepo

Nowly is an open-source Discord Rich Presence manager. The browser extension detects activity on supported sites and relays it through a local native host to Discord. Per-area `AGENTS.md` files are authoritative for their directory; this file only holds global rules.

## Workspace map

pnpm workspace (`apps/*`, `packages/*`; version pinned in root `packageManager`, Node 22).

- `apps/api` Fastify API (auth, presence registry, CDN assets, analytics ingestion, device pairing)
- `apps/web` nowly.me dashboard/site; `apps/docs` public docs
- `apps/extension` Chromium/Firefox extension; `apps/native` Go native-messaging host (`nowly.client`; contract in `internal/contract/messages.go`)
- `apps/discord` community bot, fully git-ignored: absent from fresh clones
- `packages/env` typed env per context; `shared` constants/schemas; `analytics` client/ingestion/consent; `ui` shared React components; `locales` i18n; `changelog` release notes
- Submodules (`packages/{sdk,cli,presences,internal-cli}`) are separate repos, branch `stable`. Commits there belong to their own repo; run `git status` inside them and never mix commits. CI inits only `sdk`, `cli`, `presences`.

Presence flow: author against `@nowly/sdk` in `packages/presences`, build/validate with `nowly` (`packages/cli`), publish with `pnpm admin push <slug>` (`packages/internal-cli`), the extension runs it and the native host relays it to Discord. Presence authoring rules live in `packages/presences/AGENTS.md`.

## Commands

- Setup: `git submodule update --init --recursive`, then `pnpm install` (never regenerate `pnpm-lock.yaml` unless dependencies actually changed).
- Dev: `pnpm dev:api|web|docs`, `pnpm --filter @nowly/extension dev`. Build: `pnpm build:extension[:dev]`, `pnpm build:macos`.
- There is no root lint/test aggregator. Run only the touched workspace: `pnpm --filter @nowly/<pkg> lint|typecheck|test`. Native host: `go test ./...` in `apps/native`.
- Formatting: `pnpm format` (`scripts/format.ts`) and `pnpm test:format`. Do not hand-format or add Prettier overrides.
- Git pre-commit runs `lint-staged` with `pnpm format --write` on staged TypeScript files in `apps/` and `packages/`, preserving unstaged changes and existing formatter exclusions. `pnpm install` installs the hook through `prepare` (`simple-git-hooks`); run `pnpm prepare` to reinstall it locally.
- CI on `stable` (`.github/workflows`): `lint.yml` (web, docs, extension only), `test-api.yml`, `i18n-unused.yml` (`scripts/check-i18n-unused.ts`, run with `node --experimental-strip-types`), `canary-extension.yml`, `production-extension.yml`, `host-release.yml` (tag `native-vX.Y.Z`), `presence-update.yml` / `presence-backfill.yml`. No CI job runs format, analytics/env tests or `go test` outside the release workflow.
- The i18n checker resolves literal translation keys and namespace bindings, including `Promise.all` destructuring. Dynamic template prefixes cover matching keys; nonliteral calls cover their namespace, and `getMessages()` covers top-level namespaces mentioned in the same file, avoiding false positives for runtime lookup.

## Cross-app contracts

- Env: read through `@nowly/env/<server|client|extension|cli>`; never import a context from another one.
- i18n: 11 locales defined in `packages/locales`; web/docs JSON catalogs live in `packages/locales/messages/{shared,web,docs}`. Shared UI strings are translated once in `shared`; app-specific strings stay in their app catalog. Extension messages remain in `apps/extension/messages`. User-visible strings must exist in every locale (see `packages/locales/AGENTS.md`).
- Shared footer lives in `packages/ui` and feeds both `apps/web` and `apps/docs` (see `packages/ui/AGENTS.md`).
- Legal document versions: `packages/shared/src/legal.ts` is the single source, consumed by web (`/api/legal/versions`) and the extension.
- Extension IDs (prod `kmnlnfldimgneaopdihplkebobckcjpf`, dev `abbegmindbabanjcabnmcjmamaoffbam`) are duplicated in native `main.go`, `install-{linux,macos}.sh`, `build-deb.sh` and `installer.iss`; change all together.
- Button-styled links: put `buttonVariants()` on the real `Link`/`<a>`, inside a Client Component. Never wrap navigation in `<Button>` with `render`, `asChild` or `nativeButton={false}`, and never call `buttonVariants()` in a Server Component. Reserve `<Button>` for actions that do not change the URL.

## Admin and release

- `pnpm admin` (alias `pnpm internal-cli`) runs `packages/internal-cli`: `push`/`archive` presence commands (CI uses `pnpm admin push <slug> --patch ...`; changelog text is generated from changed files unless `--changelog` is given), `r2:sync`, `r2:minify-version-bundles`, `r2:optimize-assets`, `host:publish`. Pushing requires the presence-signing key.
- `nowly` CLI (`packages/cli`: `init`, `build`, `pack`, `extension`, `list`, `validate`) has no root script; build it first with `pnpm --filter @nowly/cli build`.
- Native host messages (`PING`/`PONG`, `SET_ACTIVITY`/`CLEAR_ACTIVITY`, `CONNECTED`, `OK`/`ERROR`) are defined in `apps/native/internal/contract/messages.go`. Release by tagging `native-vX.Y.Z` (or a published GitHub release / manual `workflow_dispatch`) to trigger `host-release.yml`.
- Local full stack: `pnpm dev:api`, `pnpm dev:web`, then load the extension build output unpacked in Chrome.

## Privacy

No activity data leaves the user's machine. Analytics payloads must go through `@nowly/analytics` sanitization and consent checks; never add new payload keys that carry page titles, URLs or media metadata.

## Vendored skills

Skills listed in `skills-lock.json` are vendored under `.agents/skills/`; do not edit them. `nowly-web-page` is a local project skill migrated from Cursor and is not part of the vendor lockfile.
