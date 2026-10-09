---
title: Why Nowly asks you to allow user scripts, and how to do it
description: What the user scripts permission is, why presences need it, how to turn it on in Chrome, Edge, Brave, Opera and Firefox, and what it does not allow.
category: start
order: 2
updated: 2026-10-07
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

During setup, Nowly asks for one permission that most extensions never request: the right to run user scripts. It sounds technical, and the browser's warning can be a little scary. This guide explains what the permission really covers, why Nowly is built around it, and how to turn it on in every supported browser.

## What a user script is

A user script is a small piece of JavaScript that runs on a web page you open, on top of the page's own code. Browsers have supported them for a long time through add-ons such as Tampermonkey.

Since Manifest V3, the current format for Chrome extensions, Chrome makes a clear distinction. Code that ships inside an extension's store package is reviewed with the extension. Code that an extension adds later, after installation, is treated as a user script, and the browser only runs it once you have explicitly allowed it. Firefox follows the same idea with its own permission prompt.

## Why presences are user scripts

Each Nowly presence is the code that knows how one website works: where YouTube puts the video title, how Netflix exposes the episode number, when Spotify is playing or paused. There are more than 40 of them, and websites change their layout often.

If every presence were built into the extension, each fix would mean a new extension version and a new store review, and you would carry code for dozens of sites you never visit. Instead, the extension stays small, and presences are installed separately from the [library](/library):

- You install only the platforms you use.
- A broken presence can be fixed and republished in hours, without updating the extension.
- A presence runs only on the addresses listed for it. The YouTube presence, for example, runs on `www.youtube.com` and `m.youtube.com`, nowhere else.

## How Nowly keeps presences safe

Running downloaded code is exactly why browsers ask first, so Nowly adds its own checks on top:

- Every official presence is signed by the Nowly team with an ECDSA P-256 key. Before registering a script, the extension verifies the signature and the SHA-256 hashes of the bundle and its metadata. A script that was modified after signing is refused.
- The source of every presence is public, so anyone can read what it does before installing it.
- Presences hand what they find to the extension, which passes it to the desktop app on your computer and then to Discord. Nothing in that path goes through Nowly's servers, and presence code is reviewed before it is signed.
- Unsigned packages are only accepted by development builds loaded by hand, never by the store version.

## Turn it on in Chrome, Edge, Brave and Opera

1. Open the extensions page: `chrome://extensions` in Chrome, `edge://extensions` in Edge, `brave://extensions` in Brave or `opera://extensions` in Opera.
2. Find **Nowly** and click **Details**.
3. Turn on **Allow user scripts**.
4. Reload the tabs of the websites you want to show on Discord.

On older versions of Chrome and Chromium browsers, the **Allow user scripts** switch does not exist yet. User scripts are then enabled by the **Developer mode** switch at the top right of the extensions page. Turning it on does not change how the store version of Nowly is updated or verified.

## Turn it on in Firefox

Firefox asks once, during Nowly's onboarding, with its own permission prompt. Accept it and you are done.

If you dismissed the prompt, open `about:addons`, select **Nowly**, open the **Permissions** tab and allow the user scripts permission. Then reload the tabs you want to show.

## Check that it worked

Open the Nowly side panel with **Ctrl+Shift+Y** (**Cmd+Shift+Y** on a Mac). In the diagnostic, the row **User scripts allowed** should now be green. As soon as it is, Nowly registers the presences you installed, and the next row to look at is **Activity detected** on a supported page.

If the row stays red after you turned the permission on:

- Reload the extension from the extensions page, or restart the browser.
- Check that you changed the setting for Nowly and not for another extension.
- If your browser is managed by a school or a company, its policies may block user scripts for every extension.

## What the permission does not do

Allowing user scripts does not give Nowly access to your passwords, your other extensions or your files. It lets the extension register scripts for specific websites, and the browser still enforces each script's list of addresses. Nowly does not use it to read pages that no installed presence supports.

You can turn the permission off at any time. Presences then stop running and Discord stops showing your activity, but nothing is deleted: turn it back on and everything picks up where it left off.

## In short

User scripts are what lets Nowly support dozens of websites with a small extension, update presences quickly and install only what you need. The permission is required once per browser, and every presence that uses it is signed, public and limited to its own websites.
