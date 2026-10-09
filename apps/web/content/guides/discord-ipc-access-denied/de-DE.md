---
title: "„Access is denied“ bei discord-ipc-0 beheben (Windows)"
description: Warum Windows die Verbindung zwischen Nowly und Discord blockiert, wenn Discord als Administrator läuft, und welche fünf Schritte das Problem dauerhaft beheben.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

Unter Windows zeigt Nowly manchmal **Nowly Desktop gefunden** in Grün, aber **Discord verbunden** in Rot an. In den Protokollen steht dann etwa:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly kann außerdem eine Meldung anzeigen, dass Discord die Verbindung blockiert, und die Desktop-App kann dich über eine Windows-Benachrichtigung informieren. Die Ursache ist fast immer dieselbe – und weder ein Fehler in Nowly noch in Discord: Discord läuft mit Administratorrechten, dein Browser aber nicht.

## Was discord-ipc-0 ist

Programme, die deine Discord-Aktivität festlegen möchten, darunter Spiele, kommunizieren über einen lokalen Kanal namens Named Pipe mit der Discord-App. Unter Windows heißt die erste dieser Pipes `\\.\pipe\discord-ipc-0`. Discord erstellt sie beim Start, und die Nowly-Desktop-App öffnet sie, um deine Aktivität zu senden.

Bei diesem Schritt wird nichts über das Internet übertragen. Die beiden Programme sprechen auf demselben Computer miteinander.

## Warum Windows „Access is denied“ meldet

Windows trennt Programme, die als Administrator laufen, von gewöhnlichen Programmen. Ein mit **Als Administrator ausführen** gestartetes Programm läuft auf einer höheren Integritätsstufe. Auch die Objekte, die es erstellt – darunter Discords Named Pipe –, sind vor Programmen auf der normalen Stufe geschützt.

Dein Browser läuft auf der normalen Stufe und startet die Nowly-Desktop-App ebenfalls auf dieser Stufe. Wurde Discord als Administrator gestartet, verweigert Windows der normalen App den Zugriff auf die Pipe mit erhöhten Rechten. Die Verbindung scheitert mit **Access is denied**.

Spiele und andere Rich-Presence-Tools stoßen auf genau dasselbe Hindernis. Deshalb treten „Discord zeigt mein Spiel nicht an“ und dieser Fehler häufig gemeinsam auf.

## Die Lösung Schritt für Schritt

1. **Beende Discord vollständig.** Das Fenster zu schließen reicht nicht: Klicke mit der rechten Maustaste auf das Discord-Symbol im Infobereich neben der Uhr und wähle **Discord beenden**.
2. **Stelle sicher, dass kein Discord-Prozess mehr läuft.** Öffne den Task-Manager mit **Ctrl+Shift+Esc** und beende alle verbliebenen `Discord.exe`-Prozesse.
3. **Entferne die Administratoreinstellung.** Klicke mit der rechten Maustaste auf die Discord-Verknüpfung, die du verwendest, wähle **Eigenschaften**, öffne die Registerkarte **Kompatibilität** und entferne das Häkchen bei **Programm als Administrator ausführen**. Prüfe außerdem unter **Eigenschaften**, **Verknüpfung**, **Erweitert**, ob **Als Administrator ausführen** deaktiviert ist. Falls unter **Einstellungen für alle Benutzer ändern** die Option aktiviert ist, deaktiviere sie auch dort.
4. **Starte Discord normal** mit einem gewöhnlichen Doppelklick.
5. **Verbinde Nowly erneut.** Klicke im Nowly-Seitenpanel auf **Neu verbinden** oder starte den Browser neu.

**Discord verbunden** sollte jetzt grün werden, und deine Aktivität sollte innerhalb weniger Sekunden erscheinen.

## Wenn Discord weiterhin als Administrator startet

- Prüfe jede Verknüpfung, die du benutzt: auf dem Desktop, im Startmenü und in der Taskleiste. Jede hat ihre eigenen Einstellungen.
- Falls Discord mit Windows startet, könnte eine geplante Aufgabe oder ein Startmanager eines Drittanbieters es mit höchsten Rechten starten. Entferne diese Option oder erstelle den Autostart-Eintrag ohne sie neu.
- Manche starten Discord als Administrator, damit Push-to-Talk in Spielen funktioniert, die ebenfalls als Administrator laufen. Dann musst du dich entscheiden: Entweder laufen Discord und das Spiel beide normal, oder Rich Presence aus deinem Browser kann Discord nicht erreichen.

## Was du nicht tun solltest

Starte weder deinen Browser als Administrator noch erzwinge Administratorrechte für die Nowly-Desktop-App, um das Problem zu umgehen. Browser starten die Desktop-App selbst über Native Messaging. Ein Browser mit vollen Administratorrechten setzt dein gesamtes System den Folgen möglicher Fehler auf einer Webseite aus. Die richtige Lösung ist immer, Discord wieder auf der normalen Stufe auszuführen.

## Discord PTB und Canary

Unter Windows verbindet sich die Nowly-Desktop-App mit der ersten Discord-Pipe, `discord-ipc-0`. Falls Discord Stable und Discord PTB oder Canary gleichzeitig laufen, gehört die Pipe der Version, die zuerst gestartet wurde. Deine Aktivität erscheint nur dort. Lass nur eine Discord-App geöffnet, um Überraschungen zu vermeiden.

## Immer noch blockiert?

Ist die Fehlermeldung verschwunden, aber dein Status weiterhin leer, liegt das Problem an einer anderen Stelle der Kette. Geh zurück zur [Checkliste zur Fehlerbehebung](/guides/rich-presence-not-showing) und fahre beim Schritt **Benutzerskripte erlaubt** fort. Steht trotz der obigen Schritte weiterhin **Access is denied** in den Protokollen, eröffne auf dem Nowly-Discord-Server ein Ticket mit deiner Windows-Version und der Art, wie du Discord startest.
