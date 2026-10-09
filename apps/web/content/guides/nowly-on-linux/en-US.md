---
title: "Nowly on Linux: .deb, archive, Flatpak and Snap"
description: Install the Nowly desktop app on any distribution, fix the "update available" loop, and make Rich Presence work with Discord or a browser installed from Flatpak or Snap.
category: troubleshooting
order: 3
updated: 2026-10-07
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly works on Linux like on Windows and macOS: the browser extension detects your activity, and the desktop app passes it to the Discord app on the same computer. Linux adds a few choices, though, and sandboxed packages can get in the way. This guide covers installation on every kind of distribution and the fixes for the problems Linux users actually run into.

## Requirements

- A 64-bit (x64) distribution with glibc 2.17 or later, which covers every current mainstream distribution.
- The Discord desktop app, from Discord's `.deb`, the official archive, your distribution, Flatpak or Snap.
- Chrome, Chromium, Brave, Edge, Opera or Firefox, ideally installed from your distribution's repositories or the vendor's own package.

## Choose the right download

The [desktop app page](/desktop) offers two files for Linux:

- **The `.deb` package** for Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS and other Debian-based systems. It installs the app system-wide and registers it with every supported browser.
- **The `.tar.gz` archive** for everything else: Fedora, Arch, openSUSE and so on. It contains the app and an install script that registers it for your user.

## Install the .deb package

On most desktops, double-clicking the file opens a software installer. On some desktops, XFCE with Thunar for example, double-clicking does nothing if no graphical package installer is set up. Install it from a terminal instead:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Then check that it is really installed:

```bash
dpkg -L nowly-host
```

The list should include `/usr/lib/nowly-client/nowly-host`. Restart your browser completely, not just the tab, so it finds the new app.

## Install from the archive

Extract the archive, open a terminal in the extracted folder and run the install script it contains, following the instructions printed by the script. It copies the app into your home directory and writes the small manifest files that tell your browsers where to find it, such as `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` for Chrome or `~/.mozilla/native-messaging-hosts/nowly.client.json` for Firefox. Restart the browser afterwards.

## "Update available" right after installing

If the Nowly side panel says an update of the desktop app is available although you just installed the latest one, check these two causes in order:

1. **The `.deb` was never installed.** Run `dpkg -L nowly-host`. If it says the package is not installed, install it from a terminal as shown above.
2. **An old per-user installation is taking priority.** If you used the archive before switching to the `.deb`, the old manifest in your home directory still points to the old app. Remove it:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Then quit the browser completely and open it again, so it starts the desktop app from the new location.

## Discord installed with Flatpak or Snap

Sandboxed versions of Discord create their Rich Presence socket inside their sandbox folder instead of the usual place. The Nowly desktop app looks for `discord-ipc-0` to `discord-ipc-9` in `$XDG_RUNTIME_DIR`, `$TMPDIR` and `/tmp`, so it can miss a Flatpak or Snap Discord. Other Rich Presence tools have the same issue, and the usual fix is a symbolic link from the expected place to the real socket.

For **Discord from Flathub**, the socket is in `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Create the link with:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` is emptied at every reboot, so the link disappears too. To recreate it automatically at each login, let systemd do it:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

For **Discord from the Snap Store**, the socket usually sits in `$XDG_RUNTIME_DIR/snap.discord/`. The same kind of link works:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Start Discord before creating the link, then click **Check connection** in the Nowly side panel.

## Browser installed with Flatpak or Snap

The browser starts the Nowly desktop app through native messaging. Sandboxed browsers restrict which programs they can start, and depending on the package and its version, native messaging can be blocked entirely. The symptom is a **Nowly Desktop detected** row that never turns green, whatever you install.

The reliable fix is to use a browser installed from your distribution's repositories or from the vendor's own `.deb` or `.rpm` package, rather than its Flatpak or Snap version. Your bookmarks and passwords come back when you sign in to your browser account.

## Notifications and logs

When Discord blocks the connection because of a permission problem, the desktop app can show a desktop notification through `notify-send`, if your desktop runs a notification service.

The desktop app writes its log to `~/.cache/NowlyClient/nowly-host.log`. It can contain the activity sent to Discord, so read it before sharing it in a support ticket. You can delete it at any time.

## Checklist

- `dpkg -L nowly-host` lists the app, or the archive's install script ran without errors.
- No leftover manifest from an older installation.
- Discord is running, and its socket is reachable from `$XDG_RUNTIME_DIR` or `/tmp`.
- The browser does not come from Flatpak or Snap, or native messaging works in it.

If all four are true and Nowly still can't reach Discord, go through the [troubleshooting checklist](/guides/rich-presence-not-showing) and open a ticket on the Nowly Discord server with your distribution, desktop and the way Discord and the browser were installed.
