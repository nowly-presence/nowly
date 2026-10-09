---
title: Discord Rich Presence wird nicht angezeigt? Diese Checkliste hilft
description: Dein Discord-Status bleibt leer, während du etwas schaust oder hörst? Prüfe diese Punkte der Reihe nach – von Discords Einstellungen bis zur geöffneten Webseite.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Eine Rich Presence durchläuft eine Kette aus fünf Gliedern: die geöffnete Webseite, die Presence für diese Website, die Browser-Erweiterung, die Desktop-App und die Discord-App. Bleibt dein Status leer, ist eines dieser Glieder unterbrochen. Statt alles neu zu installieren, findest du am schnellsten heraus, welches es ist. Geh die folgenden Prüfungen der Reihe nach durch. Die meisten Probleme lassen sich mit den ersten vier lösen.

## Mit der Nowly-Diagnose beginnen

Öffne das Nowly-Seitenpanel (**Ctrl+Shift+Y** oder **Cmd+Shift+Y** auf einem Mac) in dem Tab, den du teilen möchtest. Die Diagnose zeigt sechs Zeilen: **Erweiterung installiert**, **Benutzerskripte erlaubt**, **Nowly Desktop gefunden**, **Discord verbunden**, **Eine Präsenz ist installiert** und **Aktivität erkannt**.

Lies sie von oben nach unten und halte bei der ersten Zeile an, die nicht grün ist. Jeder der folgenden Abschnitte behandelt einen dieser Punkte sowie einige Probleme, die die Diagnose vom Browser aus nicht erkennen kann.

## 1. Du nutzt die Discord-Desktop-App

Rich Presence funktioniert nur mit der Discord-App, die auf deinem Computer installiert ist. Discord in einem Browser-Tab, auf deinem Handy oder auf einem anderen Computer zeigt nichts an, selbst wenn du mit demselben Konto angemeldet bist.

Falls du beides nutzt, schließe die Browserversion von Discord: Dort kann dein Status leer erscheinen, obwohl die Desktop-App ihn allen anderen anzeigt.

## 2. Discord darf deine Aktivität anzeigen

Discord kann deine Aktivität verbergen, selbst wenn es sie empfängt:

- Öffne **Benutzereinstellungen**, dann **Activity Privacy**, und aktiviere die Option zum Teilen deiner aktuellen Aktivität.
- Prüfe deinen Status. **Unsichtbar** verbirgt deine Aktivität vor allen.
- Auf manchen Servern lässt sich das Teilen der Aktivität nur für diesen Server in dessen Datenschutzeinstellungen deaktivieren. Wenn ein Freund sie auf einem Server nicht sieht, andere aber schon, sieh dort nach.

Ein einfacher Unterschied: Wenn du die Aktivität in deinem eigenen Profil siehst, ein Freund jedoch nicht, liegt es an einer Discord-Datenschutzeinstellung und nicht an Nowly.

## 3. Die Desktop-App ist installiert und läuft

Wenn **Nowly Desktop gefunden** rot ist, erreicht die Erweiterung die Desktop-App nicht.

- Installiere sie von der [Desktop-App-Seite](/desktop), falls noch nicht geschehen, und klicke dann im Seitenpanel auf **Verbindung prüfen**.
- Falls du sie gerade installiert hast, schließe und öffne das Seitenpanel erneut oder starte den Browser neu, damit er die neue App findet.
- Installiere die App auf demselben Computer wie den Browser. Zwischen verschiedenen Computern funktioniert es nicht.
- Unter Linux sind eine nie tatsächlich installierte `.deb`-Datei oder ein über Flatpak oder Snap installierter Browser die häufigsten Ursachen. Siehe [Nowly unter Linux](/guides/nowly-on-linux).

## 4. Discord ist verbunden

Ist **Nowly Desktop gefunden** grün, aber **Discord verbunden** rot, kann die Desktop-App nicht mit Discord kommunizieren.

- Starte die Discord-Desktop-App, warte, bis sie vollständig geladen ist, und klicke dann auf **Verbindung prüfen**.
- Unter Windows läuft Discord häufig als Administrator. Die Lösung dauert nur eine Minute: [„Access is denied“ bei discord-ipc-0 beheben](/guides/discord-ipc-access-denied).
- Falls du Discord PTB oder Canary neben der normalen Discord-Version nutzt, beende alle bis auf eine.

## 5. Benutzerskripte sind erlaubt

Wenn **Benutzerskripte erlaubt** rot ist, blockiert der Browser die Presences. Aktiviere **Benutzerskripte zulassen** auf Nowlys Detailseite (oder den **Entwicklermodus** in älteren Chrome-Versionen) und lade den Tab neu. Die vollständigen Schritte für jeden Browser stehen unter [Warum Nowly um die Erlaubnis für Benutzerskripte bittet](/guides/allow-user-scripts).

## 6. Die richtige Presence ist installiert und aktiviert

Jede Website braucht eine eigene Presence. Ist **Eine Präsenz ist installiert** grün, aber auf einer bestimmten Website passiert nichts, öffne deren Seite in der [Bibliothek](/library) und prüfe, ob dort **Installiert** steht. Prüfe dann im Seitenpanel:

- Ist die Presence eingeschaltet?
- Ist das Teilen pausiert? In diesem Fall steht im Seitenpanel **Teilen pausiert**. Setze es über den Pausenbutton oder mit **Ctrl+Shift+U** fort.
- Ist die Presence vorübergehend pausiert oder befindest du dich **Außerhalb deines Zeitplans**, falls du Zeiten eingerichtet hast?
- Ist der Tab über **Diesen Tab ausblenden** ausgeblendet?

## 7. Die Presence unterstützt diese Seite

**Aktivität erkannt** bleibt rot, wenn die Presence auf der aktuellen Seite nichts zum Anzeigen findet. Fast immer liegt es an einem von zwei Dingen:

- **Du stöberst, statt etwas anzusehen.** Die meisten Presences teilen nur, was du gerade abspielst: ein Video, eine Episode, einen Song oder einen Livestream. Startseiten, Suche und Kataloge zeigen meist nichts an, solange du in den Presence-Einstellungen nicht **Browsing-Aktivität anzeigen** aktivierst. Die Bibliotheksseite jeder Presence erklärt, was sie standardmäßig zeigt.
- **Die Adresse wird nicht unterstützt.** Auf der Bibliotheksseite jeder Presence stehen unter **Unterstützte Websites** die Adressen, auf denen sie läuft. Prime Video funktioniert beispielsweise auf `primevideo.com`. Ist die Website umgezogen oder hat sich ihr Layout geändert, nutze **Problem melden** auf der Presence-Seite.

Lade den Tab einmal neu, nachdem du eine Presence installiert oder eine Einstellung geändert hast. Ein Tab, der vor der Installation geöffnet wurde, führt die Presence noch nicht aus.

## 8. Kein anderes Rich-Presence-Tool greift ein

Andere Tools, die deine Discord-Aktivität festlegen, etwa PreMiD oder ein Musikplayer mit eigener Rich Presence, können ersetzen oder löschen, was Nowly sendet. Schalte sie während des Tests aus. Auch ein laufendes Spiel kann die in deinem Profil angezeigte Aktivität übernehmen.

## 9. Immer noch nichts?

- Lade den Tab neu und starte dann Browser und Discord neu. Das klingt banal, stellt aber jede Verbindung in der Kette erneut her.
- Aktualisiere die Erweiterung, die Desktop-App und Discord.
- Öffne die Laufzeitprotokolle der Erweiterung und klicke auf **Protokolle kopieren**, um sie in ein Ticket einzufügen. Sie können Adressen unterstützter Seiten enthalten, die du besucht hast. Lies sie deshalb vor dem Teilen durch.
- Eröffne ein Ticket auf dem Nowly-Discord-Server oder melde die Presence über ihre Bibliotheksseite, falls nur eine Website betroffen ist.

## Die Kette in einem Satz

Die Webseite muss unterstützt sein, die Presence installiert und aktiv sein, Benutzerskripte müssen erlaubt sein, die Desktop-App muss erreichbar sein und Discord muss geöffnet sein und deine Aktivität anzeigen dürfen. Finde das erste Glied, das nicht funktioniert, behebe es, und der Rest klappt meist von selbst.
