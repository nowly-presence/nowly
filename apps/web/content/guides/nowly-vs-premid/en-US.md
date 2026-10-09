---
title: "Nowly vs PreMiD: an honest comparison"
description: Both show website activity on Discord. Here is how they compare on setup, catalog, privacy, safety and licensing, and how to pick the right one for the platforms you use.
category: discord
order: 3
updated: 2026-10-07
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

If you are looking for a way to show what you watch in your browser on Discord, you will quickly find two names: PreMiD, the long-standing community project, and Nowly, a newer alternative. They solve the same problem with the same basic design, so the right choice depends on details. This comparison tries to be fair, including where PreMiD is ahead.

Both projects change quickly. The facts below describe them at the time of writing; check each project's own website for the latest.

## What they have in common

- **The same architecture.** A browser extension reads the page, and a small app on your computer passes the activity to the Discord desktop app through its local connection. Neither can work with Discord in a browser tab or on a phone.
- **Per-website integrations.** Both call them presences: one script per platform, written by the community, that knows what to read on that website.
- **Free to use.** Neither charges for the extension, the desktop app or the presences.

## Where PreMiD is ahead

- **Catalog size.** PreMiD has been around for years and its community has written presences for hundreds of websites, including many niche ones. Nowly's library has more than 40 platforms today, focused on the most used ones.
- **Maturity and community.** Years of use mean many edge cases have been met and fixed, and a large community of presence authors.

If the platform you care about only exists in PreMiD's store, PreMiD is the better choice for you, simply.

## What Nowly focuses on

- **Signed presences.** Every official Nowly presence is signed by the team with an ECDSA P-256 key, and the extension checks the signature and hashes before running it. A modified script is refused.
- **Privacy by default.** Browsing activity is off by default on most presences, several presences have a privacy mode, temporary ChatGPT chats stay hidden, and usage statistics are off unless you turn them on. See [What Nowly can see](/guides/what-nowly-can-see).
- **Control in everyday use.** A global pause shortcut, hidden tabs, snoozing a presence for a few hours, and schedules per presence. See [Choose exactly what Discord shows about you](/guides/control-what-discord-shows).
- **A built-in diagnostic.** The side panel checks each link of the chain separately (extension, user scripts, desktop app, Discord, presence, activity), so you know which one to fix.
- **Side panel interface and languages.** The extension lives in the browser's side panel, and both the interface and the website are available in 11 languages.
- **Desktop app for Windows, macOS and Linux**, with a `.deb` package and an archive for other distributions.
- **Optional account sync.** Sign in with Discord only if you want your presences and settings on several browsers.

## Licensing

PreMiD's code is open source. Nowly's presences are open source under the MIT license, and its SDK and CLI are documented for contributors. The main Nowly code is public on GitHub under the Business Source License 1.1, a source-available license: you can read and audit it, but it is not an OSI-approved open-source license. If that distinction matters to you, it is worth knowing.

## Which one should you pick?

- **Your platform is only on PreMiD:** use PreMiD.
- **Your platforms are on both:** try Nowly if signed presences, privacy defaults and fine control matter to you; stay on PreMiD if you are happy with it.
- **You want both for different platforms:** possible, but be careful. Two tools updating your Discord activity at the same time can replace or clear each other's status. Make sure each platform is handled by only one of them, and turn the other tool off while you test.

## Switching from PreMiD to Nowly

1. Quit PreMiD's desktop app and disable its browser extension, so it stops updating your activity.
2. Follow [How to set up Nowly](/guides/set-up-nowly): extension, user scripts, desktop app, Discord.
3. Install from the [library](/library) the presences that replace the ones you used.
4. Check the diagnostic in the side panel, then your Discord profile.

If something you used on PreMiD is missing from the library, request it from the [support page](/support): new presences are added regularly, and anyone can write one with the [developer guide](/guides/create-your-first-presence).
