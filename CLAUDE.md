# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nowly** is an open-source Discord Rich Presence manager (alternative to PreMiD). It detects activity on supported websites via a browser extension and updates Discord Rich Presence through a local native host — no activity data is sent to external servers.

Apps:
- **apps/api** (@nowly/api) - Fastify server: auth, presence registry, assets/CDN, insights ingestion, campaigns, device pairing
- **apps/web** (@nowly/web) - Next.js user dashboard/website (nowly.me)
- **apps/docs** (@nowly/docs) - Next.js public documentation site
- **apps/insights** (@nowly/insights) - Next.js internal analytics dashboard (campaigns, usage views, AI chat over analytics data)
- **apps/extension** (@nowly/extension) - Chromium/Firefox extension that runs presence scripts in the background and talks to the native host
- **apps/discord** (@nowly/discord) - Community Discord bot (status, presence lookup, support, donator roles)
- **apps/native** (Go) - Native messaging host bridging the extension to the Discord desktop client via IPC

Packages:
- **packages/env** - Typed env vars per context (server, client, extension, cli)
- **packages/shared** - Cross-app constants/formatting/schemas
- **packages/analytics** - Shared analytics client/ingestion/consent logic used by extension, web, api, insights
- **packages/ui** - Shared React component library (shadcn-style primitives)
- **packages/locales** - Shared i18n message catalogs
- **packages/sdk**, **packages/cli**, **packages/presences**, **packages/internal-cli** - **git submodules**, each backed by its own GitHub repo (see below)

The flow: a presence is authored against `@nowly/sdk` in `packages/presences` → built/validated by the `nowly` CLI (`packages/cli`) → published to the API/CDN via `packages/internal-cli` → the extension downloads and executes it → the native host relays the activity to Discord.

## Git Submodules

`packages/sdk`, `packages/presences`, `packages/cli`, and `packages/internal-cli` are git submodules, each mirroring a standalone repo under `nowly-presence/*` on GitHub (see root `README.md` "Repositories" table). They are **not** regular workspace folders — commits inside them belong to their own repo/branch (`stable`), not this one.

```bash
git submodule update --init --recursive          # fetch submodule contents after cloning
git submodule update packages/sdk packages/cli packages/presences   # what CI does before lint (does not include internal-cli)
```

When editing files under these paths, check `git status` inside the submodule directory — changes there are a separate commit in a separate repo.

## Monorepo Structure (pnpm workspaces)

```
apps/
  api/           # Fastify server (Node.js)
  web/           # Next.js user dashboard
  docs/          # Next.js public docs
  insights/      # Next.js internal analytics dashboard
  extension/     # Chromium/Firefox extension (Vite-style build via tsx scripts)
  discord/       # Discord bot (Node.js)
  native/        # Native host (Go, cross-platform)

packages/
  env/           # Typed environment variables (t3-oss/env-core)
  shared/        # Shared constants, formatting, zod schemas
  analytics/     # Shared analytics client/ingestion
  ui/            # Shared React component library
  locales/       # Shared i18n catalogs
  sdk/           # [submodule] Presence SDK types & runtime helpers
  cli/           # [submodule] `nowly` CLI - init/build/pack/validate presences
  presences/     # [submodule] Presence source definitions
  internal-cli/  # [submodule] Admin CLI - publishing, R2/CDN sync
```

`pnpm-workspace.yaml` includes `apps/*` and `packages/*`. Use `pnpm --filter @nowly/PACKAGE` to run commands on a specific package. Package manager is pinned via `packageManager` in root `package.json` — check that field rather than assuming a version.

## Development Commands

### Setup
```bash
git submodule update --init --recursive   # required before install if submodules are empty
pnpm install                              # respects pnpm-lock.yaml
```

### Dev servers (root scripts)
```bash
pnpm dev:api                    # Fastify API with tsx watch
pnpm dev:web                    # Next.js web app
pnpm dev:docs                   # Next.js docs site
pnpm dev:insights               # Next.js insights dashboard
pnpm --filter @nowly/extension dev   # extension dev build (watch, canary)
```

### Building
```bash
pnpm build:extension             # production extension build (chrome)
pnpm build:extension:dev         # dev extension build
pnpm build:macos                 # native host macOS .app/.dmg (apps/native/scripts/macos-release.sh)
pnpm --filter @nowly/api build   # tsup build
pnpm --filter @nowly/sdk build   # tsup build (submodule)
pnpm --filter @nowly/cli build   # tsup build (submodule)
```

### Testing
```bash
pnpm --filter @nowly/api test          # vitest run
pnpm --filter @nowly/api test:watch
pnpm --filter @nowly/env test
pnpm --filter @nowly/analytics test
pnpm --filter @nowly/extension test
```

### Linting & Type Checking
Each package defines its own `lint`/`typecheck` script — there is no root aggregator. What CI (`lint.yml`) actually runs:
```bash
pnpm --filter @nowly/web lint
pnpm --filter @nowly/docs lint
pnpm --filter @nowly/extension lint    # tsc --noEmit
```
Other useful ones: `pnpm --filter @nowly/api typecheck`, `pnpm --filter @nowly/shared typecheck`, `pnpm --filter @nowly/ui typecheck`.

### Presence CLI (`nowly`, packages/cli submodule)
Commands (see `packages/cli/src/commands`): `init`, `build`, `pack`, `extension`, `list`, `validate`. Run interactively with no args for a menu. Build the submodule first (`pnpm --filter @nowly/cli build`) since there's no root passthrough script for it.

### Admin/Publishing (`internal-cli` submodule)
```bash
pnpm admin              # alias for: pnpm --filter @nowly/internal-cli cli
pnpm internal-cli
pnpm --filter @nowly/internal-cli r2:sync                    # sync built presence assets to R2
pnpm --filter @nowly/internal-cli r2:minify-version-bundles
pnpm --filter @nowly/internal-cli r2:optimize-assets
pnpm --filter @nowly/internal-cli host:publish                # publish native host binaries/installer to CDN
```
`internal-cli` also exposes `push`/`archive` presence commands (`packages/internal-cli/src/commands`), used by `presence-update.yml` as `pnpm admin push <slug> --patch --ai ...`.

## Key Architectural Patterns

### Environment Configuration (@nowly/env)
- Four exports targeting different contexts: `server.ts`, `client.ts`, `extension.ts`, `cli.ts`
- Uses t3-oss/env-core + Zod for runtime validation
- Variables are context-aware (`NEXT_PUBLIC_*` for web, `VITE_*`-style for extension)
- Each context must be imported explicitly - no cross-context leakage

### Presence System (@nowly/sdk, @nowly/presences, @nowly/cli — all submodules)
- Presence source lives in `packages/presences/src/<LETTER>/<name>/`, each with `presence.ts`, `metadata.json`, `locales/`, `assets/`, `utils/`
- `presence.ts` imports the runtime API from `@nowly/sdk` (`Presence`, `PresenceType`, `createMediaTimestamps`, etc.) plus globals `Presence`, `Settings`, `Assets` injected by the build
- The `nowly` CLI (packages/cli) validates and bundles presences (esbuild) via `nowly build` / `nowly validate` / `nowly pack`
- Metadata schema (`Metadata` type in `packages/sdk/src/metadata.ts`, validated against `packages/presences/metadata.schema.json`) — see format below

### Extension Architecture (@nowly/extension)
- **Entrypoints** (`src/entrypoints/{background,content,sidepanel}`) - extension entry points built by `scripts/build.ts`
- **Background** (`src/background/`) - `router/` (message router + contracts), `managers/`, `services/`, `storage/`, `runtime/` - the persistent presence runtime and native-host bridge
- **Features** (`src/features/`) - UI feature modules: `activity` (presence tiles, detail view, context menu, scheduling/snooze), `store` (catalog browsing/install), `settings`, `onboarding`, `diagnostics`, `runtime-logs`
- **Content script** (`src/content/`) - lightweight page-context listener injected into matched sites
- Built via `tsx scripts/build.ts <chrome|firefox> [--canary] [--watch]`, packaged via `scripts/package.ts`

### API Architecture (@nowly/api/src)
- Organized by **feature**, not by route file: `src/features/{admin,assets,auth,campaigns,custom-presets,device,image-proxy,insights,presence,security,status}`, each typically with its own `*.routes.ts` + `*.service.ts`
- `src/db/client.ts` - Prisma client
- `src/shared/` - cross-feature `crypto.service.ts`, `errors.ts`, `openai.service.ts`, `paths.ts`
- Auth: Discord OAuth flow + JWT; authenticated endpoints require `Authorization: Bearer <JWT>`
- Uses Upstash Redis for caching where applicable

### Insights (@nowly/insights)
- Internal Next.js dashboard consuming `packages/analytics` + the API's `insights`/`campaigns` features
- `app/(auth)`, `app/(dashboard)/{campaigns,views}`, plus an AI chat over analytics data (`app/api/chat`, `ai/`)

### Discord Bot (@nowly/discord)
- Standalone bot (`src/client.ts`) with `commands/` (`donator`, `links`, `presence`, `status`, `support`), `events/`, `services/` - community-facing, separate from the native host's Discord IPC integration
- **`apps/discord/` is entirely git-ignored** (see root `.gitignore`) - it exists on disk here but has no commit history in this repo and isn't a submodule either. Don't assume a fresh clone of this repo has it.

### Native Host (Go, apps/native/)
- Native messaging host ID: prod `kmnlnfldimgneaopdihplkebobckcjpf`, dev `abbegmindbabanjcabnmcjmamaoffbam`
- Message contract in `internal/contract/messages.go`: `PING`/`PONG`, `SET_ACTIVITY`/`CLEAR_ACTIVITY`, `CONNECTED`, `OK`/`ERROR`
- Releasing: tag `native-vX.Y.Z` (or a published GitHub release, or manual `workflow_dispatch`) triggers `host-release.yml`

## Presence SDK API (Global in Scripts)

```typescript
const settings = Presence.Settings({ /* ... */ });
const presence = new Presence(settings);

presence.on('UpdateData', async (ctx) => {
  // Fires on every tick (page change, user setting update, etc.)
  // ctx.settings - user settings for this presence
});

await presence.setActivity(data: PresenceData); // Send to Discord
presence.clearActivity();
await presence.getStrings<T>();           // Localized strings from the presence's locales/ files
presence.formatString(str, vars);         // Interpolate a localized string
await presence.getSetting<T>(key);        // Read a single user setting value
presence.info(msg) / presence.error(msg); // Log to the extension's runtime log
```

Use `createMediaTimestamps(video)` to compute activity duration from `<audio>`/`<video>` elements.

## Presence Metadata Format

Based on `packages/sdk/src/metadata.ts` (`Metadata` type):

```json
{
  "name": "ADN",
  "author": { "name": "Gaëtan H", "github": "steellgold" },
  "contributors": [{ "name": "...", "github": "..." }],
  "url": ["example.com", "www.example.com"],
  "regExp": "^https?://(www\\.)?example\\.com/",
  "world": "isolated",
  "runAt": "document_idle",
  "color": "#0098FF",
  "category": "streaming",
  "description": { "en-US": "...", "fr-FR": "...", "es-ES": "..." },
  "longDescription": { "en-US": "...", "fr-FR": "...", "es-ES": "..." },
  "features": { "en-US": ["...", "..."] },
  "settings": {},
  "discordNative": false,
  "imageProxy": { "hostSuffixes": ["cdn.example.com"] }
}
```

`slug` is auto-derived from the folder name and must not be set manually. `category` is a single enum value (`streaming | music | video | social | gaming | tools | ai | learning | creator | other`), not an array. `world` (`isolated` default, or `main` for same-origin authenticated fetches/page globals) and `runAt` (`document_start | document_end | document_idle`, default `document_idle`) control script injection. `imageProxy` declares external CDN hosts to proxy images through via `createCachedImageProxyUrl` when Discord can't load them directly. Settings use the SDK's setting types (`BooleanSetting`, `InputSetting`, `SelectSetting`, `SliderSetting`) with multilingual `label`/`description`. Schema validated against `packages/presences/metadata.schema.json`. Optional `discordNative` marks platforms Discord already supports via account linking.

## Cursor Rules

- **Button-styled links** (web app): when a control navigates (internal `Link` or external `<a>`), do not wrap it in a `Button` with `render={<Link />}` / `asChild` / `nativeButton={false}`. Put `buttonVariants()` on the real `Link`/`<a>` instead — and only inside a Client Component, since `buttonVariants()` is a client export and breaks in a Server Component. Reserve `<Button>` for true actions (`type="button"`/`submit`) that don't change the URL.

## Common Workflows

### Adding a New Presence
1. Work inside the `packages/presences` submodule (own repo/branch)
2. `nowly init` (packages/cli) - scaffolds a new presence under `src/<LETTER>/<name>/`
3. Implement `presence.on('UpdateData')`, call `setActivity()`, add `locales/` strings
4. `nowly validate` / `nowly build` to check metadata and bundle the script
5. Publish via `pnpm admin push <slug>` (packages/internal-cli) — requires the presence-signing key

### Running Full Local Stack
```bash
pnpm dev:api          # Terminal 1
pnpm dev:web          # Terminal 2
# Load the extension in Chrome as unpacked from apps/extension's build output
```

## Tooling & Versions

- **pnpm** - version pinned via `packageManager` in root `package.json`; check that field, don't assume
- **Node** - CI mixes Node 20 and 22 across workflows; check the specific workflow's `setup-node` step
- **TypeScript** - mostly `6.0.3` across the workspace; `apps/discord` is still on `5.7.3`
- **Go 1.23** - native host
- **Vitest** - test runner for Node packages
- **tsx** - TS CLI runner (no build step needed for most packages/apps in dev)
- **esbuild** - bundles presence scripts via the `nowly` CLI

## CI/CD (GitHub Actions)

- **lint.yml** - on push to `stable`: inits/updates the sdk/cli/presences submodules, then runs `web`, `docs`, `extension` lint
- **test-api.yml** - API vitest suite on push to `stable`
- **i18n-unused.yml** - checks for unused i18n keys on PRs targeting `stable`
- **presence-update.yml** - on merged PRs labeled `presence` touching presence source, detects changed presences and runs `pnpm admin push <slug> --patch --ai ...` per slug (note: this workflow's paths/build step still reference the pre-submodule `packages/websites` layout — verify against current `packages/presences` path before relying on it)
- **canary-extension.yml** - builds a canary extension build on push to `stable`
- **host-release.yml** - triggered by `native-vX.Y.Z` tag, a published GitHub release, or manual dispatch; builds native host binaries/installer and publishes to CDN
