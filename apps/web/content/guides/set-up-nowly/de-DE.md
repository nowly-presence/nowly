---
title: Nowly einrichten und deine Aktivität auf Discord anzeigen
description: Eine vollständige Anleitung – von der Browser-Erweiterung über die Desktop-App bis zu deiner ersten Presence und den Prüfungen, die zeigen, dass alles funktioniert.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly zeigt, was du auf Websites schaust, hörst oder besuchst, als Discord Rich Presence: die Karte unter deinem Namen mit Titel, Bild, Fortschrittsbalken und manchmal einem Button. Die Einrichtung dauert etwa fünf Minuten und braucht drei Dinge: eine Browser-Erweiterung, eine kleine Desktop-App und eine Presence für jede Website, die du anzeigen möchtest. Diese Anleitung führt dich der Reihe nach durch alle Schritte und endet mit den Prüfungen, die bestätigen, dass alles verbunden ist.

## Was du vor dem Start brauchst

- **Einen Computer**: Windows 10 oder 11, macOS 11 Big Sur oder neuer oder eine 64-Bit-Linux-Distribution.
- **Einen Browser**: Chrome, Edge, Brave, Opera oder einen anderen Chromium-Browser oder Firefox.
- **Die Discord-Desktop-App**, installiert und angemeldet. Discord in einem Browser-Tab oder auf deinem Handy kann keine Rich Presence von einem anderen Programm empfangen und funktioniert deshalb nicht mit Nowly.

Du brauchst kein Nowly-Konto. Alles Folgende ist kostenlos.

## Schritt 1: Browser-Erweiterung installieren

Öffne die [Erweiterungsseite](/extension) in deinem üblichen Browser. Der Button führt dich zum passenden Store: zum Chrome Web Store für Chrome, Edge, Brave und Opera oder zu Firefox Add-ons für Firefox. Klicke auf **Hinzufügen**, bestätige die Installation und hefte das Nowly-Symbol an deine Symbolleiste, damit es immer nur einen Klick entfernt ist.

Nowly befindet sich im Seitenpanel deines Browsers (in Firefox in der Seitenleiste). Öffne es über das Symbol in der Symbolleiste oder mit **Ctrl+Shift+Y** (**Cmd+Shift+Y** auf einem Mac). Beim ersten Öffnen erklärt ein kurzes Onboarding die einzelnen Schritte. Du kannst ihm folgen oder hier weiterlesen: Die Schritte sind dieselben.

## Schritt 2: Benutzerskripte erlauben

Jede Presence ist ein kleines Skript, das nur auf der Website läuft, für die es geschrieben wurde. Browser nennen diese Skripte Benutzerskripte und fragen vor ihrer Ausführung um deine Erlaubnis.

- **Chrome, Edge, Brave, Opera**: Öffne `chrome://extensions` (oder `edge://extensions`, `brave://extensions`, `opera://extensions`), suche Nowly, klicke auf **Details** und aktiviere **Benutzerskripte zulassen**. In älteren Chrome-Versionen gibt es diesen Schalter noch nicht: Aktiviere stattdessen oben rechts auf der Erweiterungsseite den **Entwicklermodus**.
- **Firefox**: Das Onboarding fragt einmalig nach der Berechtigung. Erlaube sie.

Wenn du genau wissen möchtest, was diese Berechtigung erlaubt, lies [Warum Nowly um die Erlaubnis für Benutzerskripte bittet](/guides/allow-user-scripts).

## Schritt 3: Desktop-App installieren

Discord nimmt Rich Presence nur von einem Programm an, das auf demselben Computer läuft – über eine lokale Verbindung, die Websites und Erweiterungen nicht selbst öffnen können. Die Nowly-Desktop-App (in der Erweiterung als Nowly Desktop angezeigt) ist dieses Programm. Sie hat kein Fenster: Dein Browser startet sie bei Bedarf, und sie übermittelt deine Aktivität an Discord.

Öffne die [Desktop-App-Seite](/desktop). Sie erkennt dein System und bietet die passende Datei an.

- **Windows**: Starte das Installationsprogramm. Der Build ist noch nicht mit einem kostenpflichtigen Zertifikat signiert, daher kann Windows SmartScreen eine Warnung anzeigen. Wähle **Weitere Informationen** und dann **Trotzdem ausführen** – aber nur bei einer Datei, die du von nowly.me heruntergeladen hast.
- **macOS**: Öffne das Disk-Image und folge den Anweisungen. Die App wurde von Apple notarisiert und wird deshalb von Gatekeeper akzeptiert.
- **Linux**: Installiere unter Debian, Ubuntu oder Mint das `.deb`-Paket. Lade für andere Distributionen das Archiv herunter und führe das darin enthaltene Installationsskript aus. Falls etwas schiefgeht, lies [Nowly unter Linux](/guides/nowly-on-linux).

## Schritt 4: Discord öffnen und Aktivitätseinstellung prüfen

Starte die Discord-Desktop-App und lass sie geöffnet. Prüfe dann, ob Discord deine Aktivität anzeigen darf: Öffne **Benutzereinstellungen**, dann **Activity Privacy**, und stelle sicher, dass das Teilen deiner aktuellen Aktivität aktiviert ist. Die genaue Bezeichnung ändert sich je nach Discord-Version; gemeint ist der Schalter für deine Aktivität oder Statusmeldung.

Denk auch daran: Solange dein Status **Unsichtbar** ist, sieht niemand deine Aktivität, egal was Nowly sendet.

## Schritt 5: Deine erste Presence installieren

Presences findest du in der [Bibliothek](/library). YouTube eignet sich am besten für den ersten Test, weil du ein Video in wenigen Sekunden starten kannst:

1. Öffne die [YouTube-Presence](/library/youtube).
2. Warte, bis die Seite die Erweiterung erkennt, und klicke auf **Installieren**.
3. Öffne ein Video auf YouTube und starte die Wiedergabe.

Du kannst Presences auch direkt im Seitenpanel installieren: Der Tab **Bibliothek** in der Erweiterung zeigt denselben Katalog. Vor der Installation wird jede Presence anhand ihrer digitalen Signatur geprüft.

## Schritt 6: Diagnose ablesen

Öffne das Nowly-Seitenpanel. Die Diagnose zeigt sechs Prüfungen, die jeweils grün werden, sobald alles bereit ist:

| Prüfung | Bedeutung |
| --- | --- |
| Erweiterung installiert | Die Erweiterung läuft in diesem Browser. |
| Benutzerskripte erlaubt | Der Browser lässt Nowly Presences ausführen. |
| Nowly Desktop gefunden | Die Desktop-App hat der Erweiterung geantwortet. |
| Discord verbunden | Die Desktop-App hat die Discord-App erreicht. |
| Eine Präsenz ist installiert | Mindestens eine Presence ist installiert. |
| Aktivität erkannt | Eine Presence hat im aktuellen Tab etwas zum Anzeigen gefunden. |

Wenn alle sechs Prüfungen grün sind, sieh dir dein Discord-Profil an: Du solltest **Schaut YouTube** mit Videotitel, Kanal, Vorschaubild und Fortschrittsbalken sehen. Bleibt eine Zeile rot, behebe sie zuerst: Sie ist das nächste Glied in der Kette. Die [Checkliste zur Fehlerbehebung](/guides/rich-presence-not-showing) behandelt jeden Fall.

## Was deine Freunde sehen

Bei der YouTube-Presence zeigt ein laufendes Video den Titel, den Kanalnamen, das Vorschaubild und die vergangene Zeit sowie einen Button **Video ansehen**. Wenn du pausierst, ersetzt ein Pausensymbol das Wiedergabesymbol. Beim Durchsuchen der YouTube-Startseite oder der Suche wird standardmäßig nichts angezeigt: Die meisten Presences teilen nur, was du tatsächlich schaust oder hörst. Browsing-Aktivität kannst du für jede Presence einzeln einschalten.

## Wie es weitergeht

- Füge aus der [Bibliothek](/library) die Plattformen hinzu, die du wirklich nutzt: Netflix, Twitch, Crunchyroll, Spotify und mehr als 40 weitere.
- Erfahre in [Bestimme genau, was Discord über dich anzeigt](/guides/control-what-discord-shows), wie du pausierst, einen Tab ausblendest oder nur zu bestimmten Zeiten teilst.
- Du möchtest wissen, wie das im Hintergrund funktioniert? Lies [Was ist Discord Rich Presence?](/guides/what-is-discord-rich-presence).
