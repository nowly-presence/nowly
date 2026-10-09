---
title: What Nowly can see, and where your data goes
description: The path your activity takes from a web page to Discord, what a presence reads, what stays on your computer, and the few optional things that do reach Nowly.
category: privacy
order: 2
updated: 2026-10-07
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

A tool that knows what you watch deserves a clear answer to a simple question: where does that information go? This guide follows your activity step by step, lists what stays on your device, and is upfront about the few optional features that do talk to Nowly's servers. It is a plain-language companion to the [privacy policy](/privacy), which remains the reference.

## The short version

Your activity goes from the web page to the Discord app on your own computer, and nowhere else. It never goes through nowly.me or the Nowly API. Usage statistics are off unless you turn them on, and an account is optional.

## The path of your activity

Here is what happens when you press play on a supported website:

1. **The presence reads the page.** The presence for that website runs in your browser tab and reads what it needs: a title, an episode number, a channel name, whether the video is playing.
2. **The extension prepares the activity.** It applies your settings (pause, schedules, privacy modes, language) and builds the Rich Presence.
3. **The desktop app receives it.** The extension sends it to the Nowly desktop app through native messaging, a channel between the browser and a program on the same computer.
4. **Discord gets it locally.** The desktop app passes it to the Discord app through Discord's local connection.
5. **Discord shares it.** From there, the Discord app sends it to Discord's servers so your friends can see it, under Discord's own privacy policy.

Steps 1 to 4 all happen on your computer. Nowly's servers are not part of that path.

## What a presence reads

A presence reads only the page it was written for, and only what it needs for your status. The YouTube presence reads the video's title, channel, thumbnail address and playback position. The Spotify presence reads the track your browser is playing. A presence does not read other tabs, your browsing history, form fields or passwords.

Some websites only expose details through their own data. The Netflix presence, for example, asks Netflix's own website for the title and episode of what is playing, from inside the Netflix tab, exactly like the Netflix page does itself.

## Artwork and the image proxy

Discord has to download the pictures shown in your status. Most platforms' images are public and Discord loads them directly. Some, such as Netflix posters, can't be loaded by Discord as they are. For those, the presence uses Nowly's image proxy: the address of the image goes through the Nowly API, which fetches it so Discord can display it.

That address can relate to the title you are watching, so it is worth knowing. The proxy is used only for this purpose, never to build advertising profiles, and its logs are kept only as long as needed to run and secure the service.

## What stays on your computer

- Your installed presences, their settings and whether they are on.
- Your current activity: title, platform, duration and artwork address.
- A debug log with recent actions and the addresses of supported pages you visited, which helps when something breaks.
- The desktop app's log, `nowly-host.log`, in its cache folder.
- A local copy of your Discord name and avatar, taken from the Discord app to display them in the extension.

All of it is erased when you reset or uninstall the extension, and you can delete the desktop app's log at any time.

## The permissions, in plain words

- **Access to websites**: a lightweight script checks whether the page you open belongs to a supported platform, so the side panel can suggest the right presence. It does not send your browsing history anywhere.
- **User scripts**: lets installed presences run on their own websites. See [Why Nowly asks you to allow user scripts](/guides/allow-user-scripts).
- **Native messaging**: lets the extension talk to the desktop app on your computer.
- **Storage**: keeps your settings and presences in the browser.

## What can reach Nowly, and only if you choose it

- **Usage statistics** are off by default. If you turn them on, the Nowly API receives a random device identifier, your browser, system, language and versions, and events such as installs. Never your pages, titles, searches or Discord identity.
- **An account** is optional. If you sign in with Discord, your settings and the list of installed presences are synced between your browsers. Your current activity, tabs and history are never synced.
- **Likes and reports** you send from a presence page reach the Nowly API, with what you wrote for a report.
- **Downloading presences** from the library contacts Nowly's servers and CDN, like any download.

## Your data, under your control

- The [Your data](/consent) page lets you turn statistics on or off, and export or delete everything stored for your device.
- The [account page](/account) lets you download your account data or delete the account.
- Uninstalling the extension erases everything it stored locally.

## What Discord does with it

Once your activity reaches Discord, Discord shows it to the people allowed to see your profile and processes it under its own privacy policy. Nowly can't change that part, but you can choose what is sent in the first place: see [Choose exactly what Discord shows about you](/guides/control-what-discord-shows).
