---
title: Warum Nowly Benutzerskripte benötigt und wie du sie erlaubst
description: Was die Berechtigung für Benutzerskripte bedeutet, warum Presences sie brauchen, wie du sie in Chrome, Edge, Brave, Opera und Firefox aktivierst und was sie nicht erlaubt.
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Bei der Einrichtung bittet Nowly um eine Berechtigung, die die meisten Erweiterungen nie anfordern: Benutzerskripte ausführen zu dürfen. Das klingt technisch, und die Warnung des Browsers kann verunsichern. Diese Anleitung erklärt, was die Berechtigung tatsächlich umfasst, warum Nowly darauf aufbaut und wie du sie in jedem unterstützten Browser aktivierst.

## Was ein Benutzerskript ist

Ein Benutzerskript ist ein kleines Stück JavaScript, das zusätzlich zum eigenen Code einer geöffneten Webseite auf dieser Seite läuft. Browser unterstützen solche Skripte seit Langem über Add-ons wie Tampermonkey.

Seit Manifest V3, dem aktuellen Format für Chrome-Erweiterungen, unterscheidet Chrome klar zwischen zwei Arten von Code. Code, der im Store-Paket einer Erweiterung enthalten ist, wird zusammen mit ihr geprüft. Code, den eine Erweiterung erst nach der Installation hinzufügt, gilt als Benutzerskript. Der Browser führt ihn erst aus, wenn du es ausdrücklich erlaubt hast. Firefox verfolgt denselben Grundgedanken mit einer eigenen Berechtigungsanfrage.

## Warum Presences Benutzerskripte sind

Jede Nowly-Presence enthält den Code, der eine bestimmte Website versteht: wo YouTube den Videotitel anzeigt, wie Netflix die Episodennummer bereitstellt und wann Spotify etwas abspielt oder pausiert. Es gibt mehr als 40 Presences, und Websites ändern häufig ihr Layout.

Wären alle Presences fest in die Erweiterung eingebaut, würde jede Korrektur eine neue Erweiterungsversion und eine erneute Store-Prüfung erfordern. Außerdem würdest du Code für Dutzende Websites mitführen, die du nie besuchst. Stattdessen bleibt die Erweiterung klein, und du installierst Presences separat aus der [Bibliothek](/library):

- Du installierst nur die Plattformen, die du nutzt.
- Eine defekte Presence kann innerhalb weniger Stunden korrigiert und erneut veröffentlicht werden, ohne die Erweiterung zu aktualisieren.
- Eine Presence läuft nur auf den für sie angegebenen Adressen. Die YouTube-Presence läuft beispielsweise auf `www.youtube.com` und `m.youtube.com`, nirgendwo sonst.

## Wie Nowly Presences absichert

Gerade weil heruntergeladener Code ausgeführt wird, fragen Browser zuerst nach. Nowly ergänzt eigene Prüfungen:

- Jede offizielle Presence wird vom Nowly-Team mit einem ECDSA-P-256-Schlüssel signiert. Bevor die Erweiterung ein Skript registriert, prüft sie die Signatur und die SHA-256-Hashes des Bundles und seiner Metadaten. Ein nach der Signierung verändertes Skript wird abgelehnt.
- Der Quellcode jeder Presence ist öffentlich. Jeder kann vor der Installation nachlesen, was sie tut.
- Presences übergeben ihre Ergebnisse an die Erweiterung, die sie an die Desktop-App auf deinem Computer und von dort an Discord weiterleitet. Auf diesem Weg werden keine Nowly-Server kontaktiert; der Presence-Code wird vor der Signierung geprüft.
- Unsignierte Pakete werden nur von manuell geladenen Entwicklungsversionen akzeptiert, nie von der Store-Version.

## In Chrome, Edge, Brave und Opera aktivieren

1. Öffne die Erweiterungsseite: `chrome://extensions` in Chrome, `edge://extensions` in Edge, `brave://extensions` in Brave oder `opera://extensions` in Opera.
2. Suche **Nowly** und klicke auf **Details**.
3. Aktiviere **Benutzerskripte zulassen**.
4. Lade die Tabs der Websites neu, deren Aktivität du auf Discord anzeigen möchtest.

In älteren Versionen von Chrome und Chromium-Browsern gibt es den Schalter **Benutzerskripte zulassen** noch nicht. Dann werden Benutzerskripte über den **Entwicklermodus** oben rechts auf der Erweiterungsseite aktiviert. Das ändert nichts daran, wie die Store-Version von Nowly aktualisiert oder geprüft wird.

## In Firefox aktivieren

Firefox fragt während des Nowly-Onboardings einmalig mit einem eigenen Berechtigungsdialog. Bestätige ihn – mehr ist nicht nötig.

Falls du die Anfrage geschlossen hast, öffne `about:addons`, wähle **Nowly**, öffne den Tab **Berechtigungen** und erlaube Benutzerskripte. Lade anschließend die Tabs neu, deren Aktivität du anzeigen möchtest.

## Prüfen, ob es funktioniert hat

Öffne das Nowly-Seitenpanel mit **Ctrl+Shift+Y** (**Cmd+Shift+Y** auf einem Mac). In der Diagnose sollte die Zeile **Benutzerskripte erlaubt** jetzt grün sein. Sobald das der Fall ist, registriert Nowly deine installierten Presences. Auf einer unterstützten Seite ist dann **Aktivität erkannt** die nächste Zeile, die du prüfen solltest.

Bleibt die Zeile rot, obwohl du die Berechtigung aktiviert hast:

- Lade die Erweiterung über die Erweiterungsseite neu oder starte den Browser neu.
- Prüfe, ob du die Einstellung für Nowly und nicht für eine andere Erweiterung geändert hast.
- Wenn dein Browser von einer Schule oder einem Unternehmen verwaltet wird, können dessen Richtlinien Benutzerskripte für alle Erweiterungen sperren.

## Was die Berechtigung nicht bewirkt

Die Erlaubnis für Benutzerskripte gibt Nowly keinen Zugriff auf deine Passwörter, andere Erweiterungen oder Dateien. Sie erlaubt der Erweiterung, Skripte für bestimmte Websites zu registrieren; der Browser setzt die Adressliste jedes Skripts weiterhin durch. Nowly verwendet sie nicht, um Seiten zu lesen, die von keiner installierten Presence unterstützt werden.

Du kannst die Berechtigung jederzeit wieder deaktivieren. Dann laufen die Presences nicht mehr und Discord zeigt deine Aktivität nicht mehr an. Gelöscht wird nichts: Wenn du die Berechtigung erneut aktivierst, funktioniert alles wieder wie zuvor.

## Kurz gesagt

Dank Benutzerskripten kann Nowly mit einer kleinen Erweiterung Dutzende Websites unterstützen, Presences schnell aktualisieren und nur die installieren, die du brauchst. Die Berechtigung ist einmal pro Browser nötig; jede damit ausgeführte Presence ist signiert, öffentlich einsehbar und auf ihre Websites beschränkt.
