---
title: "Nowly unter Linux: .deb, Archiv, Flatpak und Snap"
description: Installiere die Nowly-Desktop-App auf jeder Distribution, behebe die Schleife „Update verfügbar“ und bring Rich Presence mit Discord oder einem Browser aus Flatpak oder Snap zum Laufen.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly funktioniert unter Linux wie unter Windows und macOS: Die Browser-Erweiterung erkennt deine Aktivität und die Desktop-App leitet sie an die Discord-App auf demselben Computer weiter. Unter Linux gibt es jedoch mehrere Installationswege, und Sandbox-Pakete können stören. Diese Anleitung behandelt die Installation auf allen Arten von Distributionen und die Lösungen für Probleme, auf die Linux-Nutzer tatsächlich stoßen.

## Voraussetzungen

- Eine 64-Bit-Distribution (x64) mit glibc 2.17 oder neuer; das trifft auf alle aktuellen gängigen Distributionen zu.
- Die Discord-Desktop-App, installiert aus Discords `.deb`, dem offiziellen Archiv, den Paketquellen deiner Distribution, Flatpak oder Snap.
- Chrome, Chromium, Brave, Edge, Opera oder Firefox, am besten aus den Paketquellen deiner Distribution oder dem eigenen Paket des Herstellers.

## Den richtigen Download auswählen

Die [Desktop-App-Seite](/desktop) bietet zwei Dateien für Linux an:

- **Das `.deb`-Paket** für Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS und andere Debian-basierte Systeme. Es installiert die App systemweit und registriert sie bei jedem unterstützten Browser.
- **Das `.tar.gz`-Archiv** für alle anderen Distributionen, etwa Fedora, Arch oder openSUSE. Es enthält die App und ein Installationsskript, das sie für deinen Benutzer registriert.

## Das .deb-Paket installieren

Auf den meisten Desktops öffnet ein Doppelklick auf die Datei ein Installationsprogramm. Auf manchen Desktops – etwa XFCE mit Thunar – bewirkt ein Doppelklick nichts, wenn kein grafisches Paketinstallationsprogramm eingerichtet ist. Installiere das Paket dann über ein Terminal:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Prüfe anschließend, ob es wirklich installiert wurde:

```bash
dpkg -L nowly-host
```

In der Liste sollte `/usr/lib/nowly-client/nowly-host` stehen. Starte deinen Browser vollständig neu, nicht nur den Tab, damit er die neue App findet.

## Aus dem Archiv installieren

Entpacke das Archiv, öffne ein Terminal im entpackten Ordner und führe das enthaltene Installationsskript aus. Folge dabei den Anweisungen, die das Skript ausgibt. Es kopiert die App in dein Home-Verzeichnis und schreibt kleine Manifestdateien, über die Browser sie finden können – zum Beispiel `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` für Chrome oder `~/.mozilla/native-messaging-hosts/nowly.client.json` für Firefox. Starte danach den Browser neu.

## „Update verfügbar“ direkt nach der Installation

Wenn das Nowly-Seitenpanel ein Update für die Desktop-App meldet, obwohl du gerade die neueste Version installiert hast, prüfe nacheinander diese beiden Ursachen:

1. **Die `.deb` wurde nie installiert.** Führe `dpkg -L nowly-host` aus. Falls die Ausgabe besagt, dass das Paket nicht installiert ist, installiere es wie oben gezeigt über ein Terminal.
2. **Eine alte Installation für deinen Benutzer hat Vorrang.** Wenn du vor dem Wechsel zur `.deb` das Archiv verwendet hast, verweist das alte Manifest in deinem Home-Verzeichnis noch auf die frühere App. Entferne es:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Beende den Browser danach vollständig und öffne ihn erneut, damit er die Desktop-App vom neuen Ort startet.

## Discord über Flatpak oder Snap installiert

Sandbox-Versionen von Discord legen ihren Rich-Presence-Socket im eigenen Sandbox-Ordner statt am üblichen Ort an. Die Nowly-Desktop-App sucht in `$XDG_RUNTIME_DIR`, `$TMPDIR` und `/tmp` nach `discord-ipc-0` bis `discord-ipc-9`. Deshalb kann sie Discord aus Flatpak oder Snap übersehen. Andere Rich-Presence-Tools haben dasselbe Problem. Die übliche Lösung ist ein symbolischer Link vom erwarteten Ort zum tatsächlichen Socket.

Bei **Discord aus Flathub** liegt der Socket in `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Erstelle den Link so:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` wird bei jedem Neustart geleert; der Link verschwindet dadurch ebenfalls. Lass ihn von systemd bei jeder Anmeldung automatisch neu erstellen:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Bei **Discord aus dem Snap Store** liegt der Socket normalerweise in `$XDG_RUNTIME_DIR/snap.discord/`. Ein entsprechender Link funktioniert ebenso:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Starte Discord, bevor du den Link erstellst, und klicke danach im Nowly-Seitenpanel auf **Verbindung prüfen**.

## Browser über Flatpak oder Snap installiert

Der Browser startet die Nowly-Desktop-App über Native Messaging. Browser in einer Sandbox beschränken, welche Programme sie starten dürfen; je nach Paket und Version kann Native Messaging vollständig blockiert sein. Das erkennst du daran, dass die Zeile **Nowly Desktop gefunden** nie grün wird, egal was du installierst.

Die zuverlässige Lösung ist ein Browser aus den Paketquellen deiner Distribution oder aus einem eigenen `.deb`- oder `.rpm`-Paket des Herstellers statt der Flatpak- oder Snap-Version. Deine Lesezeichen und Passwörter sind wieder da, wenn du dich bei deinem Browserkonto anmeldest.

## Benachrichtigungen und Protokolle

Wenn Discord die Verbindung wegen eines Berechtigungsproblems blockiert, kann die Desktop-App mit `notify-send` eine Desktop-Benachrichtigung anzeigen, sofern auf deinem Desktop ein Benachrichtigungsdienst läuft.

Die Desktop-App schreibt ihr Protokoll nach `~/.cache/NowlyClient/nowly-host.log`. Es kann die an Discord gesendete Aktivität enthalten; lies es daher durch, bevor du es in einem Support-Ticket teilst. Du kannst es jederzeit löschen.

## Checkliste

- `dpkg -L nowly-host` listet die App auf oder das Installationsskript aus dem Archiv lief fehlerfrei.
- Es gibt kein übrig gebliebenes Manifest einer älteren Installation.
- Discord läuft, und sein Socket ist über `$XDG_RUNTIME_DIR` oder `/tmp` erreichbar.
- Der Browser stammt nicht aus Flatpak oder Snap, oder Native Messaging funktioniert darin.

Wenn alle vier Punkte zutreffen und Nowly Discord immer noch nicht erreicht, arbeite die [Checkliste zur Fehlerbehebung](/guides/rich-presence-not-showing) durch. Eröffne dann ein Ticket auf dem Nowly-Discord-Server und nenne deine Distribution, Desktop-Umgebung und die Installationswege für Discord und den Browser.
