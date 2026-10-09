---
title: What is Discord Rich Presence? How it works and what it can show
description: The card under your Discord name explained, from the activity types and fields to the local connection that programs use to update it, and why websites need a helper.
category: discord
order: 1
updated: 2026-10-07
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

If you have seen a friend's Discord profile say **Playing** a game with a picture, a timer and a **Join** button, you have seen Rich Presence. It is the feature that lets a program describe what you are doing in detail, instead of just a name. This guide explains what a Rich Presence contains, how programs send it to Discord, and why showing a website needs a tool like Nowly.

## From a game name to a rich activity

Discord started by detecting the game you were running and writing its name under yours. Rich Presence, introduced for game developers, goes further: the program itself tells Discord what is happening, for example the map, the score or the number of players in your party, and updates it as things change.

The same mechanism works for anything, not only games. Music players, code editors and streaming tools use it, and Nowly uses it for websites.

## What a Rich Presence card contains

A Rich Presence is a small set of fields. Not every program fills all of them.

| Field | What it shows | Example with YouTube |
| --- | --- | --- |
| Activity type | The verb in front of the name | Watching |
| Name | The application | YouTube |
| Details | The first line | The video title |
| State | The second line | The channel name |
| Large image | The main picture, with a tooltip | The video thumbnail |
| Small image | A badge on the corner of the picture | A play or pause icon |
| Timestamps | Time elapsed, or a progress bar with start and end | 14:10 of 26:48 |
| Buttons | Up to two links that others can open | Watch video |

The activity type is **Playing**, **Listening**, **Watching** or **Competing**. That is why a music presence reads **Listening to Spotify** and a video presence reads **Watching Netflix**.

## How programs talk to Discord

Rich Presence does not go through the internet first. The Discord desktop app opens a local channel on your computer when it starts: a named pipe called `discord-ipc-0` on Windows, and a socket file with the same name on macOS and Linux. A program that wants to set your activity:

1. connects to that channel,
2. introduces itself with an application ID registered with Discord, which gives the activity its name and its images,
3. sends the activity fields,
4. sends updates when something changes, or clears the activity when you stop.

The Discord app then publishes the activity to your profile through Discord's servers, so your friends see it on every device.

Because the channel is local, only programs running on the same computer as the Discord desktop app can use it. Discord in a browser tab or on a phone does not open it.

## Why websites need a helper

A website cannot open that local channel. Browsers deliberately keep web pages away from your system, and extensions are sandboxed too. So even though the browser knows what video you are playing, it has no way to tell Discord directly.

That is the gap Nowly fills:

- a **presence** reads the page in your browser and prepares the activity,
- the **browser extension** collects it and applies your settings,
- the **desktop app** is the program on your computer that opens Discord's local channel and sends the activity.

The desktop app is small, has no window and is started by the browser when needed. Without it, a browser extension alone cannot update Rich Presence.

## Who can see your Rich Presence

Your activity is shown on your profile and in member lists to people who can see your status: friends, and members of servers you share, unless you turn activity sharing off in Discord's **Activity Privacy** settings or for a specific server. When your status is **Invisible**, nobody sees it.

Buttons are meant for others: they let your friends open the same video or episode.

## Limits worth knowing

- **One activity per application at a time.** When several programs update your activity, Discord may show one, several or switch between them. Avoid running two tools that show the same thing.
- **Updates are rate-limited.** Discord accepts a limited number of updates in a short time, so a status can lag a few seconds behind the page. Timestamps let Discord count the time itself instead of receiving constant updates.
- **Images must be reachable by Discord.** Pictures are downloaded by Discord, not by your computer, so private or protected images need a proxy. See [What Nowly can see](/guides/what-nowly-can-see) for how Nowly handles it.

## Rich Presence and Discord's built-in connections

Discord also shows some activities without any extra program, when you link an account in **Connections**, such as Spotify. Those integrations work differently and have their own trade-offs. The comparison is in [Discord connections or Nowly](/guides/discord-connections-vs-nowly).
