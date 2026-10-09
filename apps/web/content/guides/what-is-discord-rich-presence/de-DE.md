---
title: Was ist Discord Rich Presence? So funktioniert sie und das kann sie anzeigen
description: Die Karte unter deinem Discord-Namen erklärt – von Aktivitätstypen und Feldern über die lokale Verbindung, mit der Programme sie aktualisieren, bis zur Frage, warum Websites eine Hilfs-App brauchen.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Wenn im Discord-Profil eines Freundes schon einmal **Spielt** mit einem Spielnamen, einem Bild, einem Timer und einem Button **Beitreten** stand, hast du Rich Presence gesehen. Mit dieser Funktion kann ein Programm genauer beschreiben, was du tust, statt nur seinen Namen anzuzeigen. Diese Anleitung erklärt, woraus eine Rich Presence besteht, wie Programme sie an Discord senden und warum für Websites ein Tool wie Nowly nötig ist.

## Vom Spielnamen zur ausführlichen Aktivität

Anfangs erkannte Discord, welches Spiel du geöffnet hattest, und schrieb dessen Namen unter deinen. Rich Presence wurde für Spieleentwickler eingeführt und geht weiter: Das Programm selbst teilt Discord mit, was gerade passiert – etwa Karte, Punktestand oder Anzahl der Mitspieler in deiner Gruppe – und aktualisiert die Angaben, wenn sich etwas ändert.

Derselbe Mechanismus funktioniert nicht nur für Spiele. Auch Musikplayer, Code-Editoren und Streaming-Tools nutzen ihn; Nowly verwendet ihn für Websites.

## Was eine Rich-Presence-Karte enthält

Eine Rich Presence besteht aus einigen Feldern. Nicht jedes Programm füllt alle aus.

| Feld | Was es anzeigt | Beispiel mit YouTube |
| --- | --- | --- |
| Aktivitätstyp | Das Verb vor dem Namen | Schaut |
| Name | Die Anwendung | YouTube |
| Details | Die erste Zeile | Der Videotitel |
| Status | Die zweite Zeile | Der Kanalname |
| Großes Bild | Das Hauptbild mit Tooltip | Das Videovorschaubild |
| Kleines Bild | Ein Symbol in der Ecke des Bildes | Ein Wiedergabe- oder Pausensymbol |
| Zeitstempel | Vergangene Zeit oder einen Fortschrittsbalken mit Start und Ende | 14:10 von 26:48 |
| Buttons | Bis zu zwei Links, die andere öffnen können | Video ansehen |

Der Aktivitätstyp lautet **Spielt**, **Hört**, **Schaut** oder **Tritt an**. Deshalb steht bei einer Musik-Presence **Hört Spotify** und bei einer Video-Presence **Schaut Netflix**.

## Wie Programme mit Discord kommunizieren

Rich Presence wird nicht zuerst über das Internet gesendet. Beim Start öffnet die Discord-Desktop-App einen lokalen Kanal auf deinem Computer: unter Windows eine Named Pipe namens `discord-ipc-0`, unter macOS und Linux eine Socket-Datei mit demselben Namen. Ein Programm, das deine Aktivität setzen möchte:

1. verbindet sich mit diesem Kanal,
2. meldet sich mit einer bei Discord registrierten Anwendungs-ID an, die der Aktivität ihren Namen und ihre Bilder gibt,
3. sendet die Aktivitätsfelder,
4. sendet bei Änderungen Aktualisierungen oder entfernt die Aktivität, wenn du aufhörst.

Die Discord-App veröffentlicht die Aktivität anschließend über Discords Server in deinem Profil, damit deine Freunde sie auf allen Geräten sehen.

Da der Kanal lokal ist, können ihn nur Programme auf demselben Computer wie die Discord-Desktop-App verwenden. Discord in einem Browser-Tab oder auf einem Handy öffnet ihn nicht.

## Warum Websites eine Hilfs-App brauchen

Eine Website kann diesen lokalen Kanal nicht öffnen. Browser halten Webseiten absichtlich von deinem System fern, und auch Erweiterungen laufen in einer Sandbox. Obwohl der Browser weiß, welches Video du abspielst, kann er es Discord also nicht direkt mitteilen.

Diese Lücke schließt Nowly:

- Eine **Presence** liest die Webseite in deinem Browser und bereitet die Aktivität vor.
- Die **Browser-Erweiterung** sammelt sie und berücksichtigt deine Einstellungen.
- Die **Desktop-App** ist das Programm auf deinem Computer, das Discords lokalen Kanal öffnet und die Aktivität sendet.

Die Desktop-App ist klein, hat kein Fenster und wird bei Bedarf vom Browser gestartet. Ohne sie kann eine Browser-Erweiterung allein Rich Presence nicht aktualisieren.

## Wer deine Rich Presence sehen kann

Deine Aktivität erscheint in deinem Profil und in Mitgliederlisten für Personen, die deinen Status sehen dürfen: Freunde und Mitglieder gemeinsamer Server. Das gilt nicht, wenn du das Teilen deiner Aktivität in Discord unter **Activity Privacy** oder für einen bestimmten Server deaktivierst. Mit dem Status **Unsichtbar** sieht sie niemand.

Buttons sind für andere gedacht: Deine Freunde können damit dasselbe Video oder dieselbe Episode öffnen.

## Grenzen, die du kennen solltest

- **Eine Aktivität pro Anwendung gleichzeitig.** Wenn mehrere Programme deine Aktivität aktualisieren, zeigt Discord möglicherweise eine oder mehrere an oder wechselt zwischen ihnen. Lass möglichst nicht zwei Tools dieselbe Sache anzeigen.
- **Aktualisierungen sind begrenzt.** Discord akzeptiert innerhalb kurzer Zeit nur eine begrenzte Anzahl von Aktualisierungen. Deshalb kann der Status der Webseite um einige Sekunden hinterherhinken. Dank Zeitstempeln kann Discord die Zeit selbst weiterzählen, statt ständig neue Angaben zu erhalten.
- **Bilder müssen für Discord erreichbar sein.** Discord lädt die Bilder herunter, nicht dein Computer. Für private oder geschützte Bilder wird daher ein Proxy benötigt. Unter [Was Nowly sehen kann](/guides/what-nowly-can-see) erfährst du, wie Nowly damit umgeht.

## Rich Presence und Discords integrierte Verbindungen

Discord zeigt einige Aktivitäten auch ohne zusätzliches Programm an, wenn du unter **Verbindungen** ein Konto wie Spotify verknüpfst. Diese Integrationen funktionieren anders und haben eigene Vor- und Nachteile. Ein Vergleich steht in [Discord-Verbindungen oder Nowly](/guides/discord-connections-vs-nowly).
