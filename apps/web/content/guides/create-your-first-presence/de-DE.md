---
title: Erstelle deine erste Nowly-Presence
description: Vom leeren Ordner zur funktionierenden Discord-Aktivität – benötigte Werkzeuge, Dateien einer Presence, ein erstes Skript, lokale Tests und die Veröffentlichung.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Jede Plattform in der Nowly-Bibliothek ist dort, weil jemand eine Presence für sie geschrieben hat. Wenn eine Website fehlt, die du nutzt, kannst du sie selbst hinzufügen. Eine Presence ist ein kleines TypeScript-Projekt, in einer ersten Version meist unter hundert Zeilen. Die Nowly-CLI übernimmt die Grundstruktur, den Build und die lokalen Tests. Diese Anleitung führt dich vom Anfang bis zu einer Presence, die deinen Discord-Status aktualisiert. Die vollständige Referenz steht in der [Nowly-Dokumentation](https://docs.nowly.me/).

## Was du brauchst

- **Node.js 22 oder neuer** und **pnpm**, um die CLI auszuführen und Presences zu bauen.
- **Git**, um das Presences-Repository zu klonen und einen Pull Request zu eröffnen.
- **Einen Chromium-Browser oder Firefox** sowie die **Discord-Desktop-App** mit installierter [Nowly-Desktop-App](/desktop), um die Presence wirklich zu testen.
- Grundkenntnisse in JavaScript oder TypeScript und die Entwicklerwerkzeuge des Browsers, um die Zielseite zu untersuchen.

## Repository und CLI holen

Alle Community-Presences liegen in einem öffentlichen Repository unter der MIT-Lizenz:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` verknüpft auch das Paket `@nowly/sdk`, damit dein Editor die Typen der Presence-API kennt.

## Grundstruktur einer Presence erstellen

```bash
nowly init "Example"
```

Die CLI stellt einige Fragen und erstellt unter `src/E/Example/` einen Ordner, dessen übergeordnetes Verzeichnis nach dem Anfangsbuchstaben der Plattform benannt ist:

- `metadata.json`: Name, Autor, unterstützte Adressen, Kategorie, Farbe, Beschreibungen und Einstellungen der Presence.
- `presence.ts`: der Code, der die Webseite liest und die Aktivität setzt.
- `locales/`: die auf Discord angezeigten Texte, eine Datei pro Sprache.
- `assets/`: Logo, Symbol und Vorschaubild für Discord und die Bibliothek.

Die CLI fragt außerdem, ob Discord diese Plattform bereits über ein verknüpftes Konto anzeigt. Falls ja, kennzeichnet sie die Presence entsprechend, damit die Bibliothek Nutzer darauf hinweisen kann.

## Plattform in metadata.json beschreiben

Am wichtigsten sind die Adressen. `url` listet Hostnamen auf; `regExp` ist das Muster, zu dem die Adresse einer Seite passen muss, damit die Presence dort läuft. Begrenze beides so weit, wie die Website es erlaubt: Eine Presence sollte nie auf Seiten laufen, die sie nicht versteht.

Für `category` stehen `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` und `other` zur Auswahl. Beschreibungen werden pro Sprache geschrieben; Englisch dient als Fallback.

## Eine erste Presence schreiben

`Presence` und `Assets` werden von der Laufzeitumgebung bereitgestellt. Nur Hilfsfunktionen und -typen wie `PresenceType` werden aus dem SDK importiert:

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData` wird regelmäßig ausgelöst, solange die Seite geöffnet ist, und immer dann, wenn der Nutzer eine Einstellung ändert. Lies jedes Mal die Seite und sende die Aktivität. Wenn es nichts Anzeigenswertes gibt, rufe `presence.clearActivity()` auf, statt einen leeren Status zu senden.

Für Medien wandelt `createMediaTimestamps(video)` aus dem SDK ein `audio`- oder `video`-Element in die Start- und Endzeiten um, die Discord für einen Fortschrittsbalken benötigt.

## Die Menschen respektieren, die sie nutzen

Für Presences in der Bibliothek gelten einige Regeln, auf die sich Nutzer verlassen:

- Zeige, was jemand tatsächlich tut, nicht jede besuchte Seite. Biete für das Durchsuchen von Seiten die Einstellung **Browsing-Aktivität anzeigen** an, die standardmäßig ausgeschaltet ist.
- Biete bei persönlichen Inhalten eine Datenschutzoption an: etwa einen Modus, der Titel verbirgt, oder halte private Unterhaltungen ganz von Discord fern.
- Sende Daten nirgendwohin außer an die Aktivität und lies nicht mehr, als dafür nötig ist.
- Verwende für jeden auf Discord angezeigten Text lokalisierte Zeichenfolgen aus `locales/`.

## Lokal bauen und testen

Prüfe die Metadaten und Assets und starte dann den Build:

```bash
nowly validate
nowly build example
```

Wenn Nowly in deinem Browser noch nicht installiert ist, kannst du eine einsatzbereite Entwicklungserweiterung mit eingebauter Presence erstellen:

```bash
nowly extension example
nowly extension example --firefox
```

Lade `dist/extension-dev` bei aktiviertem **Entwicklermodus** über `chrome://extensions` als entpackte Erweiterung oder `dist/extension-dev-firefox/manifest.json` über `about:debugging` in Firefox als temporäres Add-on. Öffne die Zielwebsite: Dein Discord-Status sollte sich ändern.

Wenn du bereits eine entpackte Entwicklungsversion von Nowly nutzt, kannst du mit einem ZIP schneller weiterarbeiten:

```bash
nowly pack example
```

Ziehe anschließend `dist/packs/example.zip` im Bereich **Einstellungen**, **Erweitert**, **Debug** der Erweiterung hinein. Unsignierte ZIP-Dateien werden nur in entpackten Builds akzeptiert, niemals in der Store-Version.

## Presence veröffentlichen

1. Führe `nowly validate` ein letztes Mal aus und prüfe die Presence auf mehreren echten Seiten, auch wenn gerade nichts abgespielt wird.
2. Eröffne im Presences-Repository einen Pull Request mit einer kurzen Beschreibung und einem Screenshot des Discord-Status.
3. Das Team prüft den Code, signiert das Release und veröffentlicht es in der Bibliothek. Danach kann jeder die Presence mit einem Klick installieren, und du wirst auf ihrer Bibliotheksseite als Autor genannt.

## Weiterführende Informationen

Die Dokumentation beschreibt die vollständige Presence-API, Einstellungen, Lokalisierung, Zeitstempel, Iframes und den Bild-Proxy für Bilder, die Discord nicht direkt laden kann. Beginne mit [Deine erste Presence erstellen](https://docs.nowly.me/presence-development/creating-your-first-presence) und halte die [Richtlinien für Beiträge](https://docs.nowly.me/publishing/contribution-guidelines) bereit, bevor du deinen Pull Request eröffnest.
