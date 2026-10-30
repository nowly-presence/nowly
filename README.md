<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.nowly.me/brand/lockup/white.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.nowly.me/brand/lockup/dark.svg" />
    <img src="https://cdn.nowly.me/brand/lockup/dark.svg" height="88" alt="Nowly" />
  </picture>

  **Show what you watch, listen to and do on the web as a Discord Rich Presence.**

  [Get Nowly](https://nowly.me/extension) · [Explore presences](https://nowly.me/library) · [Documentation](https://docs.nowly.me) · [Get help](https://nowly.me/support) · [Sponsor Nowly](https://github.com/sponsors/nowly-presence)
</div>

## How it works

A **presence** is a small script for a supported website. The Nowly browser extension runs the presences you install, and the Nowly desktop app passes their activity to the Discord desktop app over a local connection. A presence can show a title, artwork, elapsed time or a button, depending on the website and its settings.

```text
Supported website → Installed presence → Browser extension → Nowly desktop app → Discord desktop app
```

The activity sent to Discord does not pass through Nowly's servers. Other optional features, such as account sync and usage statistics, have separate data flows; see [what Nowly can see](https://nowly.me/guides/what-nowly-can-see) and the [privacy policy](https://nowly.me/privacy). The extension and desktop app are ad-free; the website may show clearly identified ads on guide articles if advertising is enabled.

## Get started

1. Install the [browser extension](https://nowly.me/extension) for Chrome, Edge, Brave, Opera, another Chromium-based browser, or Firefox.
2. Allow user scripts when your browser asks. This lets installed presences run on their supported sites.
3. Install [Nowly Desktop](https://nowly.me/desktop) for Windows, macOS or Linux, and open the **Discord desktop app** with activity sharing enabled. Discord in a browser tab is not enough.
4. Install a presence from the [library](https://nowly.me/library), then open its supported website. [YouTube](https://nowly.me/library/youtube) is a quick first check: play a video and inspect your Discord profile.

No Nowly account is needed for this setup. For browser-specific steps and the six connection checks, follow the [setup guide](https://nowly.me/guides/set-up-nowly). If a status does not appear, use the [troubleshooting guide](https://nowly.me/guides/rich-presence-not-showing).

## Project layout

This [repository](https://github.com/nowly-presence/nowly) is a pnpm workspace with the website, API, extension and desktop host:

| Path | Responsibility |
| --- | --- |
| `apps/web` | Public website, presence library, guides and account UI |
| `apps/docs` | Developer documentation |
| `apps/extension` | Browser extension and presence runtime |
| `apps/native` | Desktop host that communicates with Discord (Go) |
| `apps/api` | API for the website and optional services |
| `packages/ui`, `packages/locales`, `packages/shared`, `packages/env`, `packages/telemetry`, `packages/changelog`, `packages/og` | Shared workspace code |

The presence ecosystem lives in **separate repositories**, each with its own history, issues and pull requests:

| Repository | Local path | Purpose |
| --- | --- | --- |
| [`nowly-presence/presences`](https://github.com/nowly-presence/presences) | `packages/presences` | Community presence definitions (MIT) |
| [`nowly-presence/sdk`](https://github.com/nowly-presence/sdk) | `packages/sdk` | `@nowly/sdk`: public presence APIs and types (MIT) |
| [`nowly-presence/cli`](https://github.com/nowly-presence/cli) | `packages/cli` | `@nowly/cli`: presence authoring, validation and local testing (MIT) |
| `nowly-presence/internal-cli` | `packages/internal-cli` | Private release and CDN publishing tools (maintainers only) |

To build a presence, start with the [developer documentation](https://docs.nowly.me) and the [presences repository](https://github.com/nowly-presence/presences). The SDK and CLI are published on npm and have their own usage guides.

## Development

### Requirements

- **Node.js 22.22.1 or newer** and the pnpm version pinned in the root `package.json` (`corepack enable` selects it).
- **Git**.
- For the API: a PostgreSQL database. For the desktop host: Go (see [`apps/native`](https://github.com/nowly-presence/nowly/tree/stable/apps/native)).

### Setup

```bash
git clone https://github.com/nowly-presence/nowly.git
cd nowly
corepack enable
pnpm install
pnpm dev:web
```

Copy the `.env.example` of the app you run (`apps/web`, `apps/api`, `apps/extension`) to `.env` when you need non-default values. Other entry points: `pnpm dev:api`, `pnpm dev:docs`, `pnpm --filter @nowly/extension dev`. Run targeted checks for the workspace you change, such as `pnpm --filter @nowly/web lint`, and read [CONTRIBUTING.md](https://github.com/nowly-presence/nowly/blob/stable/CONTRIBUTING.md) before opening a pull request.

### Related repositories in `packages/`

On a local machine, `pnpm install` also clones `sdk`, `cli` and `presences` into `packages/` when they are missing. These folders are ordinary Git repositories: they are git-ignored here and excluded from the pnpm workspace, so commit, install and open pull requests **inside each of them**.

```bash
pnpm repos          # clone missing repositories and show their branches
pnpm repos --pull   # also fast-forward the ones without local changes
```

Set `NOWLY_SKIP_REPOS=1` to skip the automatic clone; it never runs in CI or Docker builds. The private internal CLI is not cloned: maintainers clone it into `packages/internal-cli` and run `npm install` there.

With `packages/presences` cloned and built (`nowly build <slug>` inside it), `pnpm build:extension:dev` bakes the built presences into the development extension.

### Updating a clone that used Git submodules

The `packages/` repositories used to be Git submodules. After pulling, Git may print `unable to rmdir 'packages/…': Directory not empty` once; the folders and their local changes stay in place. Run `pnpm install` (or `pnpm repos`) to turn each former submodule into a standalone repository: its Git data moves from `.git/modules/` into the folder. Do not delete `.git/modules/` before that, or those folders lose their history.

### Security

For a security issue, **do not open a public ticket**. Use [private vulnerability reporting](https://github.com/nowly-presence/nowly/security/advisories/new) or follow [SECURITY.md](https://github.com/nowly-presence/nowly/blob/stable/SECURITY.md).

## Support Nowly

Nowly can be used without payment. If you would like to support hosting and development, use [Ko-fi](https://ko-fi.com/nowly) or [GitHub Sponsors](https://github.com/sponsors/nowly-presence). Sponsoring does not unlock product features.

<!-- supporters:start -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/AnastasisArt"><img src="https://github.com/AnastasisArt.png?size=96" width="64" height="64" alt="AnastasisArt" /><br /><sub><b>AnastasisArt</b></sub></a></td>
    <td align="center"><a href="https://github.com/mo-gd"><img src="https://github.com/mo-gd.png?size=96" width="64" height="64" alt="mo-gd" /><br /><sub><b>mo-gd</b></sub></a></td>
    <td align="center"><img src="https://ko-fi.com/img/anon9.png?v=11" width="64" height="64" alt="Topinambour" /><br /><sub><b>Topinambour</b></sub></td>
    <td align="center"><a href="https://github.com/Galadou"><img src="https://github.com/Galadou.png?size=96" width="64" height="64" alt="Galadou" /><br /><sub><b>Galadou</b></sub></a></td>
  </tr>
</table>
<!-- supporters:end -->

## License

The Nowly code in this repository is open source under the [MIT License](https://github.com/nowly-presence/nowly/blob/stable/LICENSE), copyright K.Ring. The public [presences](https://github.com/nowly-presence/presences), [SDK](https://github.com/nowly-presence/sdk), [CLI](https://github.com/nowly-presence/cli), and [Discord bot](https://github.com/nowly-presence/bot) are licensed separately under MIT. The private internal CLI is not covered by this repository's licence. Third-party platform names, logos, and other content remain subject to their owners' rights.
