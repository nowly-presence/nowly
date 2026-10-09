---
title: Discord Rich Presence not showing? A checklist that works
description: Your Discord status stays empty while you watch or listen? Go through these checks in order, from Discord's own settings to the page you are on.
category: troubleshooting
order: 1
updated: 2026-10-07
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

A Rich Presence goes through a chain of five links: the page you are on, the presence for that website, the browser extension, the desktop app and the Discord app. When your status stays empty, one of those links is broken, and the fastest fix is to find which one instead of reinstalling everything. Go through the checks below in order. Most problems are solved by the first four.

## Start with the Nowly diagnostic

Open the Nowly side panel (**Ctrl+Shift+Y**, or **Cmd+Shift+Y** on a Mac) on the tab you want to share. The diagnostic shows six rows: **Extension installed**, **User scripts allowed**, **Nowly Desktop detected**, **Discord connected**, **A presence is installed** and **Activity detected**.

Read them from top to bottom and stop at the first one that is not green. Each section below matches one of them, plus a few cases the diagnostic cannot see from your browser.

## 1. You are using the Discord desktop app

Rich Presence only works with the Discord app installed on your computer. Discord in a browser tab, on your phone or on another computer will not show anything, even if you are signed in to the same account.

If you use both, close the browser version of Discord: it can make you think your status is empty while the desktop app shows it to everyone else.

## 2. Discord is allowed to show your activity

Discord can hide your activity even when it receives it:

- Open **User Settings**, then **Activity Privacy**, and turn on the option that shares your current activity.
- Check your status. **Invisible** hides your activity from everyone.
- Some servers let you turn off activity sharing just for that server, in the server's privacy settings. If a friend in one server can't see it but others can, look there.

A quick way to tell the difference: if your own profile shows the activity but a friend doesn't see it, the problem is a Discord privacy setting, not Nowly.

## 3. The desktop app is installed and running

If **Nowly Desktop detected** is red, the extension cannot reach the desktop app.

- Install it from the [desktop app page](/desktop) if you haven't yet, then click **Check connection** in the side panel.
- If you just installed it, close and reopen the side panel, or restart the browser so it picks up the new app.
- Install the app on the same computer as the browser. It does not work across machines.
- On Linux, the most common causes are a `.deb` that was never really installed, or a browser installed from Flatpak or Snap. See [Nowly on Linux](/guides/nowly-on-linux).

## 4. Discord is connected

If **Nowly Desktop detected** is green but **Discord connected** is red, the desktop app cannot talk to Discord.

- Start the Discord desktop app and wait until it has fully loaded, then click **Check connection**.
- On Windows, the most common cause is Discord running as administrator. The fix takes a minute: [Fix "Access is denied" on discord-ipc-0](/guides/discord-ipc-access-denied).
- If you run Discord PTB or Canary next to the regular Discord, quit all but one of them.

## 5. User scripts are allowed

If **User scripts allowed** is red, the browser blocks presences. Turn on **Allow user scripts** in Nowly's details page (or **Developer mode** on older versions of Chrome), then reload the tab. The full steps for each browser are in [Why Nowly asks you to allow user scripts](/guides/allow-user-scripts).

## 6. The right presence is installed and turned on

Each website needs its own presence. If **A presence is installed** is green but nothing happens on one site, open that site's page in the [library](/library) and check that it says **Installed**. Then, in the side panel:

- Make sure the presence is turned on.
- Check that sharing is not paused. When it is, the side panel says **Sharing is paused**. Resume with the pause button or **Ctrl+Shift+U**.
- Check that the presence is not snoozed and that you are not **Outside your schedule** if you set sharing hours.
- Check that the tab itself is not hidden with **Hide this tab**.

## 7. The page is one the presence supports

**Activity detected** stays red when the presence has nothing to show on the current page. Two things explain almost every case:

- **You are browsing, not watching.** Most presences only share what you are actually playing: a video, an episode, a track, a live stream. On most of them, home pages, search and catalogs show nothing unless you turn on **Show browsing activity** in that presence's settings. Each presence's library page explains what it shows by default.
- **The address is not supported.** Each presence lists the addresses it runs on, under **Supported sites** on its library page. Prime Video, for example, runs on `primevideo.com`. If the site has moved to a new address or changed its layout, use **Report a problem** on the presence page.

After installing a presence or changing a setting, reload the tab once. A page opened before the presence was installed does not have it yet.

## 8. Another Rich Presence tool is not interfering

Other tools that set your Discord activity, such as PreMiD or a music player with its own Rich Presence, can replace or clear what Nowly sends. Turn them off while you test. A game you are playing can also take over the activity shown on your profile.

## 9. Still nothing?

- Reload the tab, then restart the browser and Discord. It sounds basic, but it re-creates every connection in the chain.
- Update the extension, the desktop app and Discord.
- Open the extension's runtime logs and click **Copy logs** to paste them in a ticket. The logs can include the addresses of supported pages you visited, so read them before you share them.
- Open a ticket on the Nowly Discord server, or report the presence from its library page if only one website is affected.

## The chain, in one sentence

The page has to be supported, the presence installed and running, user scripts allowed, the desktop app reachable, Discord open and allowed to show your activity. Find the first link that fails, fix it, and the rest usually follows.
