# Building the Nowly browser extension from source

This archive is the full source of the `nowly` monorepo (minus `node_modules`,
build output, and local secrets, which are all git-ignored). The browser
extension itself lives under `apps/extension`.

## Operating system and environment requirements

- Any OS that runs Node.js and pnpm (Windows, macOS, or Linux).
- [Node.js 22.x](https://nodejs.org/)
- pnpm, pinned to `11.25.0` via the `packageManager` field in the root
  `package.json` - installed automatically by Corepack.

## Install steps

```sh
corepack enable
pnpm install --frozen-lockfile
```

Run this from the repository root (not from `apps/extension`), since this is
a pnpm workspace monorepo and the extension depends on a few internal
packages (`@nowly/analytics`, `@nowly/env`, `@nowly/locales`, `@nowly/shared`).

## Build script

```sh
cd apps/extension
pnpm exec tsx scripts/build.ts firefox
```

This runs `apps/extension/scripts/build.ts` (a small Vite-based build script,
no custom tooling beyond Vite/esbuild) and produces the exact contents of the
submitted extension at `apps/extension/dist/firefox`.

For a Chrome build instead: `pnpm exec tsx scripts/build.ts chrome`.

(`pnpm build:chrome`/`pnpm build:firefox` build the canary/dev variant instead -
do not use those to reproduce a store submission.)

## What the build script does

`scripts/build.ts` bundles three entry points with Vite (`sidepanel`,
`background`, `content`), copies `_locales` and CDN-fetched brand icons, and
writes a browser-specific `manifest.json` derived from the repo's
`manifest.json`. No code generation beyond standard Vite/esbuild bundling and
minification is involved - all extension logic is authored in TypeScript/React
under `apps/extension/src`.
