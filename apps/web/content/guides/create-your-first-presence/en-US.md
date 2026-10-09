---
title: Create your first Nowly presence
description: From an empty folder to a working Discord activity: the tools you need, the files of a presence, a first script, local testing and how to get it published.
category: developers
order: 1
updated: 2026-10-07
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Every platform in the Nowly library exists because someone wrote a presence for it. If a website you use is missing, you can add it yourself. A presence is a small TypeScript project, usually under a hundred lines for a first version, and the Nowly CLI handles the scaffolding, the build and the local testing. This guide takes you from nothing to a presence that updates your Discord status. The full reference lives in the [Nowly documentation](https://docs.nowly.me/).

## What you need

- **Node.js 22 or later** and **pnpm**, to run the CLI and build presences.
- **Git**, to clone the presences repository and open a pull request.
- **A Chromium browser or Firefox**, and the **Discord desktop app** with the [Nowly desktop app](/desktop) installed, to test for real.
- Basic JavaScript or TypeScript, and the browser's developer tools to inspect the page you target.

## Get the repository and the CLI

All community presences live in one public repository, under the MIT license:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` also links the `@nowly/sdk` package, which gives your editor the types of the Presence API.

## Scaffold a presence

```bash
nowly init "Example"
```

The CLI asks a few questions and creates a folder under `src/E/Example/`, named after the first letter of the platform:

- `metadata.json`: the name, author, supported addresses, category, colour, descriptions and settings of the presence.
- `presence.ts`: the code that reads the page and sets the activity.
- `locales/`: the strings shown on Discord, one file per language.
- `assets/`: the logo, icon and thumbnail used on Discord and in the library.

The CLI also asks whether Discord already shows this platform through a linked account. If it does, it marks the presence so the library can tell users.

## Describe the platform in metadata.json

The most important fields are the addresses. `url` lists the host names, and `regExp` is the pattern a page address must match for the presence to run. Keep them as narrow as the site allows: a presence should never run on pages it doesn't understand.

The `category` is one value among `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` and `other`. Descriptions are written per language, and English is the fallback.

## Write a first presence

`Presence` and `Assets` are provided by the runtime. Only helpers such as `PresenceType` are imported from the SDK:

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData` fires regularly while the page is open and whenever the user changes a setting. Each time, read the page and send the activity. When there is nothing worth showing, call `presence.clearActivity()` instead of sending an empty status.

For media, `createMediaTimestamps(video)` from the SDK turns an `audio` or `video` element into the start and end times Discord needs for a progress bar.

## Respect the people who use it

The presences in the library follow a few rules that users rely on:

- Show what the user is actually doing, not everything they browse. Put browsing pages behind a **Show browsing activity** setting, off by default.
- Offer a privacy option when the content can be personal: a mode that hides titles, or keeping private conversations out of Discord.
- Never send data anywhere else than to the activity, and don't read more than the activity needs.
- Use localized strings from `locales/` for every text shown on Discord.

## Build and test locally

Validate the metadata and the assets, then build:

```bash
nowly validate
nowly build example
```

If Nowly is not installed in your browser yet, bake the presence into a ready-made development extension:

```bash
nowly extension example
nowly extension example --firefox
```

Load `dist/extension-dev` unpacked from `chrome://extensions` with **Developer mode** on, or load `dist/extension-dev-firefox/manifest.json` as a temporary add-on from `about:debugging` in Firefox. Open the target website, and your Discord status should change.

If you already run an unpacked development build of Nowly, iterate faster with a zip:

```bash
nowly pack example
```

Then drop `dist/packs/example.zip` in the extension's **Settings**, **Advanced**, **Debug** section. Unsigned zips are only accepted by unpacked builds, never by the store version.

## Get it published

1. Run `nowly validate` one last time and check the presence on a few real pages, including when nothing is playing.
2. Open a pull request on the presences repository with a short description and a screenshot of the Discord status.
3. The team reviews the code, signs the release and publishes it to the library. From there, anyone can install it in one click, and you appear as its author on its library page.

## Going further

The documentation covers the full Presence API, settings, localization, timestamps, iframes and the image proxy for artwork that Discord can't load directly. Start with [Creating your first presence](https://docs.nowly.me/presence-development/creating-your-first-presence) and keep the [contribution guidelines](https://docs.nowly.me/publishing/contribution-guidelines) at hand before you open your pull request.
