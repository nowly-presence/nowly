---
title: Was Nowly sehen kann und wohin deine Daten gelangen
description: Der Weg deiner Aktivität von der Webseite zu Discord, was eine Presence liest, was auf deinem Computer bleibt und welche wenigen optionalen Daten Nowly erreichen.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Ein Tool, das weiß, was du schaust, sollte eine einfache Frage klar beantworten: Wohin gelangen diese Informationen? Diese Anleitung verfolgt deine Aktivität Schritt für Schritt, zeigt, was auf deinem Gerät bleibt, und erklärt offen, welche wenigen optionalen Funktionen mit Nowlys Servern kommunizieren. Sie ergänzt die [Datenschutzerklärung](/privacy) in einfachen Worten; maßgeblich bleibt die Datenschutzerklärung.

## Kurzfassung

Deine Aktivität geht von der Webseite zur Discord-App auf deinem eigenen Computer und sonst nirgendwohin. Sie läuft nie über nowly.me oder die Nowly-API. Nutzungsstatistiken sind deaktiviert, solange du sie nicht einschaltest, und ein Konto ist freiwillig.

## Der Weg deiner Aktivität

Das geschieht, wenn du auf einer unterstützten Website die Wiedergabe startest:

1. **Die Presence liest die Seite.** Die Presence für diese Website läuft in deinem Browser-Tab und liest, was sie braucht: einen Titel, eine Episodennummer, einen Kanalnamen und ob das Video gerade läuft.
2. **Die Erweiterung bereitet die Aktivität auf.** Sie berücksichtigt deine Einstellungen (Pause, Zeitpläne, Datenschutzmodi, Sprache) und erstellt die Rich Presence.
3. **Die Desktop-App empfängt sie.** Die Erweiterung sendet die Aktivität per Native Messaging an die Nowly-Desktop-App – über einen Kanal zwischen Browser und Programm auf demselben Computer.
4. **Discord erhält sie lokal.** Die Desktop-App übermittelt die Aktivität über Discords lokale Verbindung an die Discord-App.
5. **Discord teilt sie.** Von dort sendet die Discord-App die Aktivität an Discords Server, damit deine Freunde sie sehen können. Dafür gilt Discords eigene Datenschutzerklärung.

Die Schritte 1 bis 4 finden vollständig auf deinem Computer statt. Nowlys Server sind daran nicht beteiligt.

## Was eine Presence liest

Eine Presence liest nur die Website, für die sie geschrieben wurde, und nur die Informationen, die sie für deinen Status braucht. Die YouTube-Presence liest Videotitel, Kanal, Adresse des Vorschaubilds und Wiedergabeposition. Die Spotify-Presence liest den Titel, der in deinem Browser abgespielt wird. Eine Presence liest weder andere Tabs noch deinen Browserverlauf, Formulareingaben oder Passwörter.

Manche Websites stellen Details nur über ihre eigenen Daten bereit. Die Netflix-Presence fragt beispielsweise innerhalb des Netflix-Tabs bei der Netflix-Website nach Titel und Episode des laufenden Inhalts – genauso wie die Netflix-Seite selbst.

## Bilder und der Bild-Proxy

Discord muss die Bilder in deinem Status herunterladen können. Bei den meisten Plattformen sind sie öffentlich zugänglich und Discord lädt sie direkt. Manche Bilder, etwa Netflix-Poster, kann Discord so nicht laden. Dafür nutzt die Presence Nowlys Bild-Proxy: Die Bildadresse läuft über die Nowly-API, die das Bild abruft, damit Discord es anzeigen kann.

Diese Adresse kann Rückschlüsse auf den Titel zulassen, den du schaust. Der Proxy wird ausschließlich zu diesem Zweck genutzt, nicht zum Erstellen von Werbeprofilen. Seine Protokolle werden nur so lange aufbewahrt, wie es für Betrieb und Sicherheit des Dienstes nötig ist.

## Was auf deinem Computer bleibt

- Deine installierten Presences, ihre Einstellungen und ob sie aktiviert sind.
- Deine aktuelle Aktivität: Titel, Plattform, Dauer und Bildadresse.
- Ein Debug-Protokoll mit kürzlich ausgeführten Aktionen und den Adressen unterstützter Seiten, die du besucht hast; es hilft bei Problemen.
- Das Protokoll der Desktop-App, `nowly-host.log`, in ihrem Cache-Verzeichnis.
- Eine lokale Kopie deines Discord-Namens und Avatars, die aus der Discord-App stammen und in der Erweiterung angezeigt werden.

All das wird gelöscht, wenn du die Erweiterung zurücksetzt oder deinstallierst. Das Protokoll der Desktop-App kannst du jederzeit selbst löschen.

## Die Berechtigungen einfach erklärt

- **Zugriff auf Websites**: Ein leichtes Skript prüft, ob eine geöffnete Seite zu einer unterstützten Plattform gehört, damit das Seitenpanel die passende Presence vorschlagen kann. Dein Browserverlauf wird nicht an andere Orte gesendet.
- **Benutzerskripte**: Damit können installierte Presences auf ihren jeweiligen Websites laufen. Siehe [Warum Nowly um die Erlaubnis für Benutzerskripte bittet](/guides/allow-user-scripts).
- **Native Messaging**: Damit kann die Erweiterung mit der Desktop-App auf deinem Computer kommunizieren.
- **Speicher**: Darin bewahrt der Browser deine Einstellungen und Presences auf.

## Was Nowly nur mit deiner Entscheidung erreichen kann

- **Nutzungsstatistiken** sind standardmäßig deaktiviert. Wenn du sie aktivierst, erhält die Nowly-API eine zufällige Gerätekennung, deinen Browser, dein System, deine Sprache und Versionen sowie Ereignisse wie Installationen. Niemals deine Seiten, Titel, Suchanfragen oder Discord-Identität.
- **Ein Konto** ist freiwillig. Wenn du dich mit Discord anmeldest, werden deine Einstellungen und die Liste installierter Presences zwischen deinen Browsern synchronisiert. Deine aktuelle Aktivität, Tabs und dein Verlauf werden niemals synchronisiert.
- **Likes und Meldungen**, die du auf einer Presence-Seite sendest, erreichen die Nowly-API; bei einer Meldung auch dein eingegebener Text.
- **Das Herunterladen von Presences** aus der Bibliothek kontaktiert Nowlys Server und CDN, wie jeder Download.

## Deine Daten unter deiner Kontrolle

- Auf der Seite [Deine Daten](/consent) kannst du Nutzungsstatistiken ein- oder ausschalten und alles exportieren oder löschen, was für dein Gerät gespeichert wurde.
- Auf der [Kontoseite](/account) kannst du deine Kontodaten herunterladen oder dein Konto löschen.
- Wenn du die Erweiterung deinstallierst, werden alle von ihr lokal gespeicherten Daten gelöscht.

## Was Discord damit macht

Sobald deine Aktivität Discord erreicht, zeigt Discord sie den Personen an, die dein Profil sehen dürfen, und verarbeitet sie nach seiner eigenen Datenschutzerklärung. Diesen Teil kann Nowly nicht ändern. Du kannst aber bestimmen, was überhaupt gesendet wird: Siehe [Bestimme genau, was Discord über dich anzeigt](/guides/control-what-discord-shows).
