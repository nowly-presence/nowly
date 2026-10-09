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

The [main repository](https://github.com/nowly-presence/nowly) is a pnpm workspace. Its separate SDK, CLI, presence catalog and internal publishing tool are tracked as Git submodules under `packages/`.

| Path | Responsibility |
| --- | --- |
| `apps/web` | Public website, presence library, guides and account UI |
| `apps/docs` | Developer documentation |
| `apps/extension` | Browser extension and presence runtime |
| `apps/native` | Local host that communicates with Discord |
| `apps/api` | API for the website and optional services |
| `apps/insights` | Internal analytics dashboard |
| `packages/ui`, `packages/locales`, `packages/shared`, `packages/env`, `packages/analytics` | Shared workspace code |
| [`packages/presences`](https://github.com/nowly-presence/presences) | Community presence definitions (MIT) |
| [`packages/sdk`](https://github.com/nowly-presence/sdk) | Public presence APIs and types (MIT) |
| [`packages/cli`](https://github.com/nowly-presence/cli) | Presence authoring, validation and local testing (MIT) |
| `packages/internal-cli` | Private release and CDN publishing tools (BUSL-1.1) |

To build a presence, start with the [developer documentation](https://docs.nowly.me) and the [presences repository](https://github.com/nowly-presence/presences). The public [`@nowly/sdk`](https://github.com/nowly-presence/sdk) and [`@nowly/cli`](https://github.com/nowly-presence/cli) have their own usage guides.

## Contributing

Use **Node.js 22** and the pnpm version pinned in the root `package.json` (currently `pnpm@11.25.0`). The private `packages/internal-cli` submodule requires maintainer access; contributors without it can initialize only the public submodules:

```bash
git clone https://github.com/nowly-presence/nowly.git
cd nowly
git submodule update --init packages/sdk packages/cli packages/presences
corepack enable
pnpm install
pnpm dev:web
```

Other entry points include `pnpm dev:docs` and `pnpm dev:api`. Run targeted checks for the workspace you change, such as `pnpm --filter @nowly/web lint`. Read [CONTRIBUTING.md](https://github.com/nowly-presence/nowly/blob/stable/CONTRIBUTING.md) before opening a pull request. Changes in a submodule belong in its **own repository**; the main repository records only its pinned revision.

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

The main Nowly code is **source-available under the [Business Source License 1.1](https://github.com/nowly-presence/nowly/blob/stable/LICENSE)**, not an OSI-approved open-source license. The public presences, SDK and CLI have separate **MIT** licenses in their respective repositories. Check each component's license before reusing or redistributing it.
