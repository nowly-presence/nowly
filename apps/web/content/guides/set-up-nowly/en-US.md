---
title: How to set up Nowly and show your activity on Discord
description: A complete walkthrough, from the browser extension to the desktop app, your first presence and the checks that tell you everything works.
category: start
order: 1
updated: 2026-10-07
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly shows what you watch, listen to or browse on websites as a Discord Rich Presence: the card under your name with a title, artwork, a progress bar and sometimes a button. Setting it up takes about five minutes and three pieces: a browser extension, a small desktop app, and one presence per website you want to show. This guide goes through each of them in order and ends with the checks that confirm everything is connected.

## What you need before you start

- **A computer**: Windows 10 or 11, macOS 11 Big Sur or later, or a 64-bit Linux distribution.
- **A browser**: Chrome, Edge, Brave, Opera or another Chromium browser, or Firefox.
- **The Discord desktop app**, installed and signed in. Discord in a browser tab or on your phone cannot receive a Rich Presence from another program, so it will not work with Nowly.

You don't need a Nowly account. Everything below is free.

## Step 1: install the browser extension

Open the [extension page](/extension) from the browser you use every day. The button points to the right store for that browser: the Chrome Web Store for Chrome, Edge, Brave and Opera, and Firefox Add-ons for Firefox. Click **Add**, confirm, and pin the Nowly icon to your toolbar so it stays one click away.

Nowly lives in your browser's side panel (the sidebar in Firefox). Open it with the toolbar icon or with **Ctrl+Shift+Y** (**Cmd+Shift+Y** on a Mac). The first time, a short onboarding explains each step. You can follow it or keep reading here: the steps are the same.

## Step 2: allow user scripts

Each presence is a small script that runs only on the website it was written for. Browsers call these user scripts and ask for your permission before running them.

- **Chrome, Edge, Brave, Opera**: open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, `opera://extensions`), find Nowly, click **Details** and turn on **Allow user scripts**. On older versions of Chrome this switch does not exist yet: turn on **Developer mode** at the top right of the extensions page instead.
- **Firefox**: the onboarding asks for the permission once. Accept it.

If you want to know exactly what this permission allows, read [Why Nowly asks you to allow user scripts](/guides/allow-user-scripts).

## Step 3: install the desktop app

Discord only accepts a Rich Presence from a program running on the same computer, through a local connection that websites and extensions cannot open by themselves. The Nowly desktop app (shown as Nowly Desktop in the extension) is that program. It has no window: your browser starts it when Nowly needs it, and it passes your activity to Discord.

Open the [desktop app page](/desktop). It detects your system and offers the right file.

- **Windows**: run the installer. The build is not signed with a paid certificate yet, so Windows SmartScreen may show a warning. Choose **More info**, then **Run anyway**, but only for a file you downloaded from nowly.me.
- **macOS**: open the disk image and follow the instructions. The app is notarized by Apple, so Gatekeeper accepts it.
- **Linux**: on Debian, Ubuntu or Mint, install the `.deb` package. On other distributions, download the archive and run the install script it contains. If anything goes wrong, see [Nowly on Linux](/guides/nowly-on-linux).

## Step 4: open Discord and check its activity setting

Start the Discord desktop app and leave it running. Then check that Discord is allowed to show your activity: open **User Settings**, then **Activity Privacy**, and make sure sharing your current activity is turned on. The exact wording changes between Discord versions, but it is the switch that mentions your activity or status message.

Also keep in mind that when your status is **Invisible**, nobody sees your activity, whatever Nowly sends.

## Step 5: install your first presence

Presences come from the [library](/library). YouTube is the best first test because a video starts in seconds:

1. Open the [YouTube presence](/library/youtube).
2. Wait until the page detects the extension, then click **Install**.
3. Open a video on YouTube and press play.

You can also install presences without leaving the side panel: the **Library** tab inside the extension lists the same catalog. Every presence is verified with a digital signature before it is installed.

## Step 6: read the diagnostic

Open the Nowly side panel. The diagnostic lists six checks, and each one turns green when it is ready:

| Check | What it means |
| --- | --- |
| Extension installed | The extension is running in this browser. |
| User scripts allowed | The browser lets Nowly run presences. |
| Nowly Desktop detected | The desktop app answered the extension. |
| Discord connected | The desktop app reached the Discord app. |
| A presence is installed | At least one presence is installed. |
| Activity detected | A presence found something to show on the current tab. |

When all six are green, look at your Discord profile: you should see **Watching YouTube** with the video title, the channel, the thumbnail and a progress bar. If a row stays red, fix that one first: it is always the next thing in the chain. The [troubleshooting checklist](/guides/rich-presence-not-showing) covers every case.

## What your friends see

With the YouTube presence, a playing video shows its title, the channel name, the thumbnail and the time elapsed, plus a **Watch video** button. When you pause, a pause icon replaces the play icon. Browsing YouTube's home page or search shows nothing by default: most presences only share what you are actually watching or listening to, and browsing activity is an option you turn on per presence.

## Where to go next

- Add the platforms you really use from the [library](/library): Netflix, Twitch, Crunchyroll, Spotify and more than 40 others.
- Learn how to pause, hide a tab or share only during certain hours in [Choose exactly what Discord shows about you](/guides/control-what-discord-shows).
- Curious about what happens behind the scenes? Read [What is Discord Rich Presence?](/guides/what-is-discord-rich-presence)
