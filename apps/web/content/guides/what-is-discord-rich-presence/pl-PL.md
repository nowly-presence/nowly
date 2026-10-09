---
title: Czym jest Discord Rich Presence? Jak działa i co może pokazywać
description: Wyjaśnienie karty pod Twoją nazwą na Discordzie — od typów aktywności i pól po lokalne połączenie używane do jej aktualizowania i powód, dla którego strony potrzebują pośrednika.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Jeśli widziałeś na profilu znajomego na Discordzie informację, że **Gra** w grę, z obrazkiem, licznikiem czasu i przyciskiem **Dołącz**, widziałeś Rich Presence. Ta funkcja pozwala programowi szczegółowo opisać Twoją aktywność, zamiast wyświetlać tylko nazwę gry. Ten poradnik wyjaśnia, jakie informacje zawiera Rich Presence, jak programy wysyłają je do Discorda i dlaczego pokazywanie aktywności na stronie internetowej wymaga narzędzia takiego jak Nowly.

## Od nazwy gry do szczegółowego statusu

Discord początkowo wykrywał uruchomioną grę i pokazywał jej nazwę pod Twoją. Rich Presence, wprowadzone z myślą o twórcach gier, idzie dalej: sam program informuje Discorda, co się w nim dzieje — na przykład jaka jest mapa, wynik lub liczba graczy w drużynie — i aktualizuje te informacje, gdy coś się zmienia.

Ten sam mechanizm działa nie tylko w grach. Korzystają z niego odtwarzacze muzyki, edytory kodu i narzędzia streamingowe, a Nowly używa go dla stron internetowych.

## Co zawiera karta Rich Presence

Rich Presence składa się z kilku pól. Nie każdy program wypełnia je wszystkie.

| Pole | Co pokazuje | Przykład dla YouTube |
| --- | --- | --- |
| Typ aktywności | Czasownik przed nazwą | Ogląda |
| Nazwa | Aplikację | YouTube |
| Szczegóły | Pierwszy wiersz | Tytuł filmu |
| Stan | Drugi wiersz | Nazwa kanału |
| Duży obraz | Główną grafikę z podpowiedzią | Miniatura filmu |
| Mały obraz | Ikonę w rogu grafiki | Ikona odtwarzania lub pauzy |
| Znaczniki czasu | Upływający czas lub pasek postępu z początkiem i końcem | 14:10 z 26:48 |
| Przyciski | Do dwóch linków, które mogą otworzyć inni | Obejrzyj film |

Typ aktywności to **Gra**, **Słucha**, **Ogląda** lub **Rywalizuje**. Dlatego przy obecności muzycznej widnieje **Słucha Spotify**, a przy obecności wideo **Ogląda Netflix**.

## Jak programy komunikują się z Discordem

Rich Presence nie trafia najpierw do internetu. Przy uruchomieniu aplikacja desktopowa Discorda otwiera na Twoim komputerze lokalny kanał: potok nazwany `discord-ipc-0` w Windows lub plik gniazda o tej samej nazwie w macOS i Linuksie. Program, który chce ustawić Twoją aktywność:

1. łączy się z tym kanałem,
2. przedstawia się identyfikatorem aplikacji zarejestrowanym w Discordzie, który nadaje aktywności nazwę i obrazy,
3. wysyła pola aktywności,
4. wysyła aktualizacje, gdy coś się zmienia, albo usuwa aktywność, gdy kończysz.

Następnie aplikacja Discorda publikuje aktywność na Twoim profilu za pośrednictwem serwerów Discorda, dzięki czemu znajomi widzą ją na każdym urządzeniu.

Ponieważ kanał jest lokalny, mogą z niego korzystać wyłącznie programy działające na tym samym komputerze co aplikacja desktopowa Discorda. Discord w karcie przeglądarki ani na telefonie go nie otwiera.

## Dlaczego strony internetowe potrzebują pośrednika

Strona internetowa nie może otworzyć tego lokalnego kanału. Przeglądarki celowo ograniczają dostęp stron do systemu, a rozszerzenia również działają w piaskownicy. Przeglądarka wie więc, jaki film odtwarzasz, ale nie może powiedzieć o tym Discordowi bezpośrednio.

Nowly wypełnia tę lukę:

- **obecność** odczytuje stronę w Twojej przeglądarce i przygotowuje aktywność,
- **rozszerzenie przeglądarki** odbiera ją i stosuje Twoje ustawienia,
- **aplikacja desktopowa** na Twoim komputerze otwiera lokalny kanał Discorda i wysyła aktywność.

Aplikacja desktopowa jest niewielka, nie ma własnego okna i przeglądarka uruchamia ją w razie potrzeby. Bez niej samo rozszerzenie przeglądarki nie może aktualizować Rich Presence.

## Kto może zobaczyć Twoje Rich Presence

Twoja aktywność pojawia się na profilu i listach członków u osób, które mogą zobaczyć Twój status: znajomych i członków wspólnych serwerów. Nie pojawi się, jeśli wyłączysz udostępnianie aktywności w ustawieniu **Prywatność aktywności** Discorda lub dla konkretnego serwera. Gdy masz status **Niewidoczny**, nikt jej nie zobaczy.

Przyciski są przeznaczone dla innych: pozwalają znajomym otworzyć ten sam film lub odcinek.

## Ograniczenia, o których warto wiedzieć

- **Jedna aktywność na aplikację w danej chwili.** Gdy kilka programów aktualizuje Twoją aktywność, Discord może pokazywać jedną, kilka albo przełączać się między nimi. Unikaj jednoczesnego używania dwóch narzędzi pokazujących to samo.
- **Aktualizacje mają limit częstotliwości.** Discord przyjmuje ograniczoną liczbę aktualizacji w krótkim czasie, więc status może być opóźniony względem strony o kilka sekund. Dzięki znacznikom czasu Discord sam odlicza czas bez ciągłego otrzymywania nowych danych.
- **Obrazy muszą być dostępne dla Discorda.** Grafiki pobiera Discord, a nie Twój komputer, dlatego prywatne lub chronione obrazy wymagają serwera pośredniczącego. Poradnik [Co Nowly może zobaczyć](/guides/what-nowly-can-see) wyjaśnia, jak Nowly to rozwiązuje.

## Rich Presence a wbudowane połączenia Discorda

Discord może też pokazywać niektóre aktywności bez dodatkowego programu, gdy połączysz konto w sekcji **Połączenia**, na przykład konto Spotify. Takie integracje działają inaczej i mają własne zalety oraz ograniczenia. Porównanie znajdziesz w poradniku [Połączenia Discorda czy Nowly](/guides/discord-connections-vs-nowly).
