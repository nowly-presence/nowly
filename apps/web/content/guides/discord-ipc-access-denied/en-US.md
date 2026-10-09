---
title: Fix "Access is denied" on discord-ipc-0 (Windows)
description: Why Windows blocks the connection between Nowly and Discord when Discord runs as administrator, and the five steps that fix it for good.
category: troubleshooting
order: 2
updated: 2026-10-07
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

On Windows, Nowly sometimes shows **Nowly Desktop detected** in green but **Discord connected** in red, and the logs contain a line like this one:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly may also show a message explaining that Discord blocks the connection, and the desktop app can display a Windows notification about it. The cause is almost always the same, and it is not a bug in Nowly or in Discord: Discord is running with administrator rights while your browser is not.

## What discord-ipc-0 is

Programs that want to set your Discord activity, games included, talk to the Discord app through a local channel called a named pipe. On Windows, the first one is named `\\.\pipe\discord-ipc-0`. Discord creates it when it starts, and the Nowly desktop app opens it to send your activity.

Nothing goes over the internet at this step. It is a conversation between two programs on the same computer.

## Why Windows says "Access is denied"

Windows separates programs that run as administrator from normal ones. A program started with **Run as administrator** runs at a higher integrity level, and the objects it creates, including Discord's named pipe, are protected from programs running at the normal level.

Your browser runs at the normal level, so the Nowly desktop app it starts runs at the normal level too. When Discord was started as administrator, Windows refuses to let the normal-level app open the elevated pipe, and the connection fails with **Access is denied**.

Games and other Rich Presence tools hit exactly the same wall, which is why "Discord doesn't show my game" and this error often appear together.

## The fix, step by step

1. **Quit Discord completely.** Closing the window is not enough: right-click the Discord icon in the notification area, near the clock, and choose **Quit Discord**.
2. **Make sure no Discord process is left.** Open the Task Manager with **Ctrl+Shift+Esc** and end any remaining `Discord.exe` process.
3. **Remove the administrator setting.** Right-click the Discord shortcut you use, choose **Properties**, open the **Compatibility** tab and uncheck **Run this program as an administrator**. Still in **Properties**, on the **Shortcut** tab, click **Advanced** and make sure **Run as administrator** is unchecked too. If the **Change settings for all users** button shows the option checked, uncheck it there as well.
4. **Start Discord normally**, with a regular double-click.
5. **Reconnect Nowly.** Click **Reconnect** in the Nowly side panel, or restart your browser.

**Discord connected** should now turn green, and your activity should appear within a few seconds.

## If Discord keeps starting as administrator

- Check every shortcut you use: the desktop, the Start menu, the taskbar. Each one has its own settings.
- If Discord starts with Windows, it may be launched by a scheduled task or a third-party startup manager configured to use the highest privileges. Remove that option or recreate the entry without it.
- Some users run Discord as administrator so that push-to-talk works inside games that also run as administrator. In that case, you have to choose: either both Discord and the game run normally, or Rich Presence from your browser cannot reach Discord.

## What not to do

Do not run your browser, or force the Nowly desktop app, as administrator to work around the problem. Browsers start the desktop app themselves through a mechanism called native messaging, and running a browser with full administrator rights exposes your whole system to anything that goes wrong in a web page. The right fix is always to bring Discord back to the normal level.

## Discord PTB and Canary

On Windows, the Nowly desktop app connects to the first Discord pipe, `discord-ipc-0`. If you run Discord Stable and Discord PTB or Canary at the same time, the one that started first owns that pipe, and your activity appears in that one only. Keep a single Discord app open to avoid surprises.

## Still blocked?

If the error is gone but your status stays empty, the problem is further down the chain. Go back to the [troubleshooting checklist](/guides/rich-presence-not-showing) and continue from the **User scripts allowed** step. If the logs still say **Access is denied** after the steps above, open a ticket on the Nowly Discord server with your Windows version and the way you start Discord.
