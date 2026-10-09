---
title: "Nowly vs. PreMiD: ein ehrlicher Vergleich"
description: Beide zeigen Website-Aktivitäten auf Discord an. So unterscheiden sie sich bei Einrichtung, Katalog, Datenschutz, Sicherheit und Lizenz – und so findest du die richtige Lösung für deine Plattformen.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Wenn du auf Discord zeigen möchtest, was du im Browser schaust, wirst du schnell auf zwei Namen stoßen: PreMiD, das langjährige Community-Projekt, und Nowly, eine neuere Alternative. Beide lösen dasselbe Problem mit demselben Grundprinzip. Welche Lösung die richtige ist, hängt deshalb von den Einzelheiten ab. Dieser Vergleich versucht, fair zu bleiben – auch dort, wo PreMiD voraus ist.

Beide Projekte entwickeln sich schnell weiter. Die folgenden Angaben beschreiben den Stand zum Zeitpunkt des Schreibens; prüfe für aktuelle Informationen die Websites der Projekte.

## Was sie gemeinsam haben

- **Dieselbe Architektur.** Eine Browser-Erweiterung liest die Webseite, und eine kleine App auf deinem Computer leitet die Aktivität über eine lokale Verbindung an die Discord-Desktop-App weiter. Mit Discord im Browser-Tab oder auf dem Handy funktioniert keine der beiden Lösungen.
- **Integrationen für einzelne Websites.** Beide nennen sie Presences: ein Community-Skript pro Plattform, das weiß, welche Informationen es auf dieser Website lesen muss.
- **Kostenlose Nutzung.** Weder die Erweiterung noch die Desktop-App oder die Presences kosten etwas.

## Wo PreMiD voraus ist

- **Größe des Katalogs.** PreMiD gibt es seit Jahren. Die Community hat Presences für Hunderte Websites geschrieben, darunter viele Nischenplattformen. Nowlys Bibliothek umfasst derzeit mehr als 40 Plattformen und konzentriert sich auf die am häufigsten genutzten.
- **Erfahrung und Community.** Durch die jahrelange Nutzung wurden viele Sonderfälle entdeckt und behoben. Zudem gibt es eine große Community von Presence-Entwicklern.

Wenn die Plattform, die dir wichtig ist, nur im PreMiD-Store existiert, ist PreMiD ganz einfach die bessere Wahl für dich.

## Worauf Nowly besonderen Wert legt

- **Signierte Presences.** Das Team signiert jede offizielle Nowly-Presence mit einem ECDSA-P-256-Schlüssel. Vor ihrer Ausführung prüft die Erweiterung Signatur und Hashes. Ein verändertes Skript wird abgelehnt.
- **Datenschutz als Standard.** Browsing-Aktivität ist bei den meisten Presences standardmäßig aus, mehrere bieten einen Datenschutzmodus, temporäre ChatGPT-Chats bleiben verborgen und Nutzungsstatistiken sind deaktiviert, solange du sie nicht einschaltest. Siehe [Was Nowly sehen kann](/guides/what-nowly-can-see).
- **Kontrolle im Alltag.** Eine globale Tastenkombination zum Pausieren, ausgeblendete Tabs, mehrstündiges vorübergehendes Pausieren einer Presence und eigene Zeitpläne pro Presence. Siehe [Bestimme genau, was Discord über dich anzeigt](/guides/control-what-discord-shows).
- **Integrierte Diagnose.** Das Seitenpanel prüft jedes Glied der Kette einzeln (Erweiterung, Benutzerskripte, Desktop-App, Discord, Presence, Aktivität), damit du weißt, wo du ansetzen musst.
- **Seitenpanel und Sprachen.** Die Erweiterung befindet sich im Seitenpanel des Browsers; sowohl die Oberfläche als auch die Website sind in 11 Sprachen verfügbar.
- **Desktop-App für Windows, macOS und Linux**, mit einem `.deb`-Paket und einem Archiv für andere Distributionen.
- **Optionale Kontosynchronisierung.** Melde dich nur dann mit Discord an, wenn du deine Presences und Einstellungen in mehreren Browsern nutzen möchtest.

## Lizenzierung

PreMiDs Code ist Open Source. Nowlys Presences sind unter der MIT-Lizenz Open Source; SDK und CLI sind für Mitwirkende dokumentiert. Der Hauptcode von Nowly ist auf GitHub unter der Business Source License 1.1 öffentlich zugänglich. Das ist eine Lizenz mit einsehbarem Quellcode, aber keine von der OSI anerkannte Open-Source-Lizenz: Du kannst den Code lesen und prüfen. Wenn dir dieser Unterschied wichtig ist, solltest du ihn kennen.

## Welche Lösung passt zu dir?

- **Deine Plattform gibt es nur bei PreMiD:** Nutze PreMiD.
- **Deine Plattformen gibt es bei beiden:** Probiere Nowly, wenn dir signierte Presences, datenschutzfreundliche Standardeinstellungen und präzise Kontrolle wichtig sind; bleib bei PreMiD, wenn du damit zufrieden bist.
- **Du möchtest beide für verschiedene Plattformen nutzen:** Das ist möglich, aber sei vorsichtig. Zwei Tools, die gleichzeitig deine Discord-Aktivität aktualisieren, können sich gegenseitig den Status ersetzen oder löschen. Sorge dafür, dass jede Plattform nur von einem der beiden Tools verwaltet wird, und deaktiviere das andere beim Testen.

## Von PreMiD zu Nowly wechseln

1. Beende die PreMiD-Desktop-App und deaktiviere ihre Browser-Erweiterung, damit sie deine Aktivität nicht weiter aktualisiert.
2. Folge [Nowly einrichten](/guides/set-up-nowly): Erweiterung, Benutzerskripte, Desktop-App, Discord.
3. Installiere aus der [Bibliothek](/library) Presences als Ersatz für die bisher verwendeten.
4. Prüfe erst die Diagnose im Seitenpanel und dann dein Discord-Profil.

Falls eine Plattform, die du mit PreMiD genutzt hast, in der Bibliothek fehlt, kannst du sie auf der [Supportseite](/support) vorschlagen. Neue Presences kommen regelmäßig hinzu, und mit der [Entwickleranleitung](/guides/create-your-first-presence) kann jeder selbst eine schreiben.
