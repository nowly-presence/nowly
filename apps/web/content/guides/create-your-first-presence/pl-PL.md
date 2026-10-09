---
title: Stwórz swoją pierwszą obecność Nowly
description: Od pustego folderu do działającej aktywności na Discordzie — potrzebne narzędzia, pliki obecności, pierwszy skrypt, lokalne testowanie i publikacja.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Każda platforma w bibliotece Nowly ma swoją obecność, bo ktoś ją napisał. Jeśli brakuje używanej przez Ciebie strony, możesz dodać ją samodzielnie. Obecność to niewielki projekt w TypeScripcie; pierwsza wersja zwykle mieści się w stu liniach, a narzędzie CLI Nowly zajmuje się utworzeniem struktury projektu, kompilacją i lokalnym testowaniem. Ten poradnik przeprowadzi Cię od zera do obecności aktualizującej Twój status na Discordzie. Pełną dokumentację znajdziesz w [dokumentacji Nowly](https://docs.nowly.me/).

## Czego potrzebujesz

- **Node.js 22 lub nowszy** oraz **pnpm** do uruchamiania CLI i budowania obecności.
- **Git** do sklonowania repozytorium obecności i otwarcia prośby o scalenie zmian.
- **Przeglądarka oparta na Chromium lub Firefox**, a także **aplikacja desktopowa Discorda** z zainstalowaną [aplikacją desktopową Nowly](/desktop), aby przetestować działanie w praktyce.
- Podstawowa znajomość JavaScriptu lub TypeScriptu oraz narzędzia deweloperskie przeglądarki do zbadania docelowej strony.

## Pobierz repozytorium i CLI

Wszystkie obecności tworzone przez społeczność znajdują się w jednym publicznym repozytorium na licencji MIT:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` łączy także pakiet `@nowly/sdk`, dzięki któremu edytor zna typy interfejsu Presence API.

## Utwórz szkielet obecności

```bash
nowly init "Example"
```

CLI zada kilka pytań i utworzy folder `src/E/Example/`, nazwany zgodnie z pierwszą literą nazwy platformy:

- `metadata.json`: nazwa, autor, obsługiwane adresy, kategoria, kolor, opisy i ustawienia obecności.
- `presence.ts`: kod odczytujący stronę i ustawiający aktywność.
- `locales/`: teksty wyświetlane na Discordzie, po jednym pliku na język.
- `assets/`: logo, ikona i miniatura używane na Discordzie i w bibliotece.

CLI pyta również, czy Discord już pokazuje tę platformę dzięki połączonemu kontu. Jeśli tak, oznacza obecność, aby biblioteka mogła poinformować o tym użytkowników.

## Opisz platformę w metadata.json

Najważniejsze pola to adresy. `url` zawiera nazwy hostów, a `regExp` jest wzorcem, któremu adres strony musi odpowiadać, aby obecność się uruchomiła. Ogranicz je tak mocno, jak pozwala strona: obecność nigdy nie powinna działać na stronach, których nie rozumie.

Pole `category` przyjmuje jedną z wartości `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` lub `other`. Opisy tworzy się osobno dla każdego języka, a angielski służy jako wersja zastępcza.

## Napisz pierwszą obecność

`Presence` i `Assets` udostępnia środowisko uruchomieniowe. Z SDK importuj tylko funkcje pomocnicze, takie jak `PresenceType`:

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

Zdarzenie `UpdateData` jest wywoływane regularnie, gdy strona jest otwarta, oraz za każdym razem, gdy użytkownik zmieni ustawienie. Za każdym razem odczytaj stronę i wyślij aktywność. Gdy nie ma nic wartego pokazania, wywołaj `presence.clearActivity()` zamiast wysyłać pusty status.

W przypadku multimediów funkcja `createMediaTimestamps(video)` z SDK zamienia element `audio` lub `video` na czas rozpoczęcia i zakończenia potrzebny Discordowi do wyświetlenia paska postępu.

## Szanuj osoby korzystające z obecności

Obecności w bibliotece przestrzegają kilku zasad ważnych dla użytkowników:

- Pokazuj to, co użytkownik faktycznie robi, nie wszystko, co przegląda. Ukryj aktywność na stronach przeglądania za ustawieniem **Pokazuj aktywność przeglądania**, domyślnie wyłączonym.
- Zaoferuj opcję prywatności, gdy treści mogą mieć osobisty charakter: tryb ukrywający tytuły albo możliwość niewysyłania treści prywatnych rozmów do Discorda.
- Nigdy nie wysyłaj danych nigdzie poza aktywnością i nie odczytuj więcej, niż aktywność wymaga.
- Dla każdego tekstu wyświetlanego na Discordzie używaj wersji językowych z `locales/`.

## Zbuduj i przetestuj lokalnie

Sprawdź poprawność metadanych i grafik, a następnie zbuduj projekt:

```bash
nowly validate
nowly build example
```

Jeśli nie masz jeszcze Nowly w przeglądarce, umieść obecność w gotowym rozszerzeniu programistycznym:

```bash
nowly extension example
nowly extension example --firefox
```

Wczytaj rozpakowane `dist/extension-dev` ze strony `chrome://extensions` z włączonym **Trybem dewelopera** albo wczytaj `dist/extension-dev-firefox/manifest.json` jako tymczasowy dodatek ze strony `about:debugging` w Firefoksie. Otwórz docelową stronę; Twój status na Discordzie powinien się zmienić.

Jeśli używasz już rozpakowanej programistycznej wersji Nowly, możesz szybciej wprowadzać poprawki z użyciem archiwum ZIP:

```bash
nowly pack example
```

Następnie przeciągnij `dist/packs/example.zip` do sekcji **Ustawienia**, **Zaawansowane**, **Debugowanie** w rozszerzeniu. Niepodpisane archiwa ZIP są akceptowane tylko przez rozpakowane wersje programistyczne, nigdy przez wersję ze sklepu.

## Opublikuj obecność

1. Uruchom `nowly validate` po raz ostatni i sprawdź obecność na kilku rzeczywistych stronach, również wtedy, gdy nic nie jest odtwarzane.
2. Otwórz prośbę o scalenie zmian w repozytorium obecności, dodając krótki opis i zrzut ekranu statusu na Discordzie.
3. Zespół sprawdzi kod, podpisze wydanie i opublikuje je w bibliotece. Od tej chwili każdy może zainstalować obecność jednym kliknięciem, a Ty pojawisz się jako jej autor na stronie w bibliotece.

## Więcej informacji

Dokumentacja opisuje pełne Presence API, ustawienia, wersje językowe, znaczniki czasu, ramki iframe oraz serwer pośredniczący dla grafik, których Discord nie może pobrać bezpośrednio. Zacznij od [Tworzenia pierwszej obecności](https://docs.nowly.me/presence-development/creating-your-first-presence) i przed otwarciem prośby o scalenie zmian zajrzyj do [zasad współtworzenia](https://docs.nowly.me/publishing/contribution-guidelines).
