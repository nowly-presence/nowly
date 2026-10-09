---
title: Zeige auf Discord, was du schaust (Netflix, Prime Video, Disney+ und mehr)
description: So zeigst du die Serie oder den Film, den du schaust, als Discord-Status an, erfährst, was die einzelnen Streaming-Presences zeigen, und warum das auch funktioniert, wenn Bildschirmfreigaben nur ein schwarzes Bild liefern.
category: start
order: 3
updated: 2026-10-09
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

Discord zeigt standardmäßig an, welches Spiel du spielst, aber nicht, welche Serie du im Browser schaust. Mit Nowly kann in deinem Profil **Schaut Netflix** stehen – zusammen mit Titel, Episode, Poster und Wiedergabefortschritt. Deine Freunde können dieselbe Episode mit einem Klick öffnen. Diese Anleitung erklärt die Einrichtung für Streamingdienste und was du von den einzelnen Presences erwarten kannst.

## Was du brauchst

Falls du Nowly noch nicht eingerichtet hast, folge zuerst [Nowly einrichten](/guides/set-up-nowly): Erweiterung, Benutzerskripte, Desktop-App und Discord-Desktop-App. Installiere dann für jeden Dienst, den du nutzt, eine Presence aus der [Bibliothek](/library). Zu den Streaming-Presences gehören unter anderem Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ und ADN.

## Was deine Freunde sehen

Eine Streaming-Presence füllt die Rich-Presence-Karte mit Informationen zum angezeigten Inhalt. Bei Netflix zum Beispiel:

- Oben steht **Schaut Netflix**.
- In der ersten Zeile steht der Titel der Serie oder des Films.
- Bei einer Serie folgen Staffel und Episode im Format `S1.E3` sowie der Episodentitel; bei einem Film das Erscheinungsjahr.
- Das Poster erscheint als Hauptbild, ergänzt durch ein Wiedergabe- oder Pausensymbol.
- Während der Wiedergabe werden die vergangene und die verbleibende Zeit angezeigt.
- Ein Button **Episode ansehen** oder **Film ansehen** öffnet für deine Freunde denselben Titel.

Prime Video und Disney+ funktionieren ähnlich und zeigen Staffel und Episode an, wenn der Player diese Informationen bereitstellt. Crunchyroll zeigt Serie, Episodentitel und Cover und fügt einen Button zur Serienseite hinzu.

## Schauen statt stöbern

Standardmäßig konzentrieren sich Streaming-Presences auf das, was im Player läuft. So ändert sich dein Status nicht jedes Mal, wenn du zwischen zwei Serien schwankst. Im Detail gibt es Unterschiede:

- **Netflix** zeigt erst dann etwas an, wenn ein Titel läuft. Startseite, Suche und Titelseiten bleiben privat.
- **Prime Video** und **Disney+** zeigen auch die Titelseite an, auf der du dich befindest – als **Zeigt Details an** oder **Schaut sich eine Serie an** mit ihrem Namen. Startseite, Suche und Listen bleiben privat.
- **Crunchyroll** zeigt auch zentrale Seiten an, etwa eine Serienseite, den Simulcast-Kalender, deine Merkliste oder eine Suche. Aktiviere den **Datenschutzmodus**, um Titel auszublenden.

Wenn du mehr zeigen möchtest, aktiviere **Browsing-Aktivität anzeigen** in den Einstellungen der Presence im Seitenpanel. Dein Status begleitet dich dann auch auf der Startseite, in Listen und bei Suchanfragen, wo er anzeigen kann, was du eingegeben hast.

## Warum das funktioniert, wenn die Bildschirmfreigabe scheitert

Wenn du schon einmal versucht hast, beim Netflix-Schauen deinen Bildschirm auf Discord zu teilen, hast du wahrscheinlich statt des Videos ein schwarzes Rechteck gesehen. Streamingdienste schützen ihre Videos mit DRM, und Browser schließen geschützte Videos von Bildschirmaufnahmen aus.

Rich Presence ist etwas anderes: Sie sendet niemals das Video, sondern nur beschreibenden Text und ein Poster. Deshalb funktioniert sie bei jedem Dienst und verstößt nicht gegen dessen Regeln. Wenn ihr gemeinsam schauen möchtet, nutzt die Gruppenfunktion des jeweiligen Dienstes, sofern es eine gibt. Dein Discord-Status kann deinen Freunden zeigen, was gerade läuft.

## Was du für dich behalten möchtest

Nicht jeder Abend braucht Publikum. Ein paar schnelle Möglichkeiten:

- **Alles pausieren** mit **Ctrl+Shift+U** (**Cmd+Shift+U** auf einem Mac); mit derselben Tastenkombination setzt du das Teilen fort.
- **Diesen Tab ausblenden** im Seitenpanel, damit ein Tab privat bleibt, während die anderen weiter geteilt werden.
- Eine Presence für eine Stunde, vier Stunden oder bis morgen **vorübergehend pausieren**.
- Über einen Zeitplan **nur zu bestimmten Zeiten teilen** – für alle Presences oder nur für die Streaming-Presences.
- Bei **Crunchyroll** den **Datenschutzmodus** aktivieren, damit der Titel verborgen bleibt, aber weiterhin zu sehen ist, dass du etwas schaust.

Alle Einzelheiten findest du in [Bestimme genau, was Discord über dich anzeigt](/guides/control-what-discord-shows).

## Wenn dein Status leer bleibt

- Stelle sicher, dass der Titel tatsächlich in deinem Browser abgespielt wird, nicht in einer TV-App oder auf deinem Handy.
- Prüfe, ob du auf einer von der Presence unterstützten Adresse bist: Prime Video funktioniert auf `primevideo.com`, Netflix auf `netflix.com`.
- Lade den Tab nach der Installation einer Presence einmal neu.

Für alles Weitere geht die [Checkliste zur Fehlerbehebung](/guides/rich-presence-not-showing) jedes Glied der Kette durch.
