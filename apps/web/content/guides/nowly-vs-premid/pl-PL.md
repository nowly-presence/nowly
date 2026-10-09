---
title: "Nowly a PreMiD: uczciwe porównanie"
description: Oba narzędzia pokazują aktywność ze stron internetowych na Discordzie. Porównujemy konfigurację, katalog, prywatność, bezpieczeństwo i licencje oraz podpowiadamy, które wybrać do używanych platform.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Szukając sposobu na pokazywanie na Discordzie tego, co oglądasz w przeglądarce, szybko trafisz na dwie nazwy: PreMiD, projekt społecznościowy z długą historią, oraz Nowly, nowszą alternatywę. Rozwiązują ten sam problem według tego samego podstawowego schematu, więc wybór zależy od szczegółów. W tym porównaniu staramy się być uczciwi, także wobec przewag PreMiD.

Oba projekty szybko się zmieniają. Poniższe informacje odzwierciedlają stan z chwili publikacji; po najnowsze dane zajrzyj na stronę każdego projektu.

## Co mają wspólnego

- **Ta sama architektura.** Rozszerzenie przeglądarki odczytuje stronę, a niewielka aplikacja na komputerze przekazuje aktywność aplikacji desktopowej Discorda przez lokalne połączenie. Żadne z tych narzędzi nie działa z Discordem w karcie przeglądarki ani na telefonie.
- **Integracje dla poszczególnych stron.** Oba projekty nazywają je obecnościami: to pisane przez społeczność skrypty, po jednym na platformę, które wiedzą, jakie dane odczytać z danej strony.
- **Bezpłatny dostęp.** Żaden projekt nie pobiera opłat za rozszerzenie, aplikację desktopową ani obecności.

## W czym PreMiD ma przewagę

- **Wielkość katalogu.** PreMiD działa od lat, a jego społeczność przygotowała obecności dla setek stron, w tym wielu niszowych. Biblioteka Nowly obejmuje dziś ponad 40 platform i skupia się na najpopularniejszych.
- **Dojrzałość i społeczność.** Lata użytkowania oznaczają, że wiele nietypowych problemów zostało już odkrytych i naprawionych, a społeczność autorów obecności jest duża.

Jeśli interesująca Cię platforma jest dostępna tylko w katalogu PreMiD, PreMiD będzie po prostu lepszym wyborem.

## Na czym skupia się Nowly

- **Podpisane obecności.** Każda oficjalna obecność Nowly jest podpisywana przez zespół kluczem ECDSA P-256. Przed uruchomieniem rozszerzenie sprawdza podpis i skróty plików. Zmodyfikowany skrypt zostaje odrzucony.
- **Prywatność domyślnie.** Przeglądanie stron jest domyślnie ukryte w większości obecności, kilka z nich ma tryb prywatności, tymczasowe rozmowy ChatGPT pozostają ukryte, a statystyki użytkowania są wyłączone, dopóki ich nie włączysz. Zobacz [Co Nowly może zobaczyć](/guides/what-nowly-can-see).
- **Kontrola na co dzień.** Globalny skrót do pauzy, ukryte karty, usypianie obecności na kilka godzin i harmonogramy dla poszczególnych obecności. Zobacz [Wybierz dokładnie, co Discord pokazuje o Tobie](/guides/control-what-discord-shows).
- **Wbudowana diagnostyka.** Panel boczny osobno sprawdza każde ogniwo łańcucha (rozszerzenie, skrypty użytkownika, aplikację desktopową, Discorda, obecność i aktywność), dzięki czemu wiesz, co trzeba naprawić.
- **Panel boczny i wersje językowe.** Rozszerzenie działa w panelu bocznym przeglądarki, a interfejs i strona internetowa są dostępne w 11 językach.
- **Aplikacja desktopowa dla Windows, macOS i Linuksa**, z pakietem `.deb` i archiwum dla innych dystrybucji.
- **Opcjonalna synchronizacja konta.** Zaloguj się przez Discorda tylko wtedy, gdy chcesz mieć obecności i ustawienia w kilku przeglądarkach.

## Licencje

Kod PreMiD jest otwartoźródłowy. Obecności Nowly są otwartoźródłowe na licencji MIT, a SDK i CLI są udokumentowane dla współtwórców. Główny kod Nowly jest publicznie dostępny na GitHubie na licencji Business Source License 1.1. Pozwala ona czytać i audytować kod źródłowy, ale nie jest licencją otwartoźródłową uznawaną przez OSI. Jeśli to rozróżnienie ma dla Ciebie znaczenie, warto o nim wiedzieć.

## Co wybrać?

- **Twoja platforma jest tylko w PreMiD:** użyj PreMiD.
- **Twoje platformy są w obu katalogach:** wypróbuj Nowly, jeśli zależy Ci na podpisanych obecnościach, ustawieniach prywatności i dokładnej kontroli; pozostań przy PreMiD, jeśli jesteś z niego zadowolony.
- **Chcesz używać obu do różnych platform:** to możliwe, ale wymaga uwagi. Dwa narzędzia aktualizujące jednocześnie Twoją aktywność na Discordzie mogą wzajemnie zastępować lub usuwać swój status. Zadbaj, aby każdą platformę obsługiwało tylko jedno z nich, i wyłącz drugie podczas testowania.

## Przejście z PreMiD na Nowly

1. Zamknij aplikację desktopową PreMiD i wyłącz jego rozszerzenie przeglądarki, aby przestało aktualizować Twoją aktywność.
2. Postępuj zgodnie z poradnikiem [Jak skonfigurować Nowly](/guides/set-up-nowly): rozszerzenie, skrypty użytkownika, aplikacja desktopowa i Discord.
3. Zainstaluj z [biblioteki](/library) obecności zastępujące te, których używałeś.
4. Sprawdź diagnostykę w panelu bocznym, a potem swój profil na Discordzie.

Jeśli w bibliotece brakuje czegoś, z czego korzystałeś w PreMiD, poproś o dodanie na [stronie pomocy](/support). Nowe obecności pojawiają się regularnie, a każdy może napisać własną, korzystając z [poradnika dla programistów](/guides/create-your-first-presence).
