---
title: Co Nowly może zobaczyć i dokąd trafiają Twoje dane
description: Droga Twojej aktywności od strony internetowej do Discorda, informacje odczytywane przez obecność, dane pozostające na komputerze i nieliczne opcjonalne dane trafiające do Nowly.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Narzędzie, które wie, co oglądasz, powinno jasno odpowiedzieć na proste pytanie: dokąd trafiają te informacje? Ten poradnik śledzi drogę Twojej aktywności krok po kroku, wymienia dane pozostające na urządzeniu i otwarcie opisuje kilka opcjonalnych funkcji, które kontaktują się z serwerami Nowly. To przystępne uzupełnienie [polityki prywatności](/privacy), która pozostaje dokumentem rozstrzygającym.

## W skrócie

Twoja aktywność przechodzi ze strony internetowej do aplikacji Discorda na Twoim komputerze i nigdzie indziej. Nie przechodzi przez nowly.me ani interfejs API Nowly. Statystyki użytkowania są wyłączone, dopóki ich nie włączysz, a konto jest opcjonalne.

## Droga Twojej aktywności

Oto co dzieje się, gdy rozpoczynasz odtwarzanie na obsługiwanej stronie:

1. **Obecność odczytuje stronę.** Obecność przypisana do tej strony działa w Twojej karcie przeglądarki i odczytuje potrzebne dane: tytuł, numer odcinka, nazwę kanału czy informację o tym, czy film jest odtwarzany.
2. **Rozszerzenie przygotowuje aktywność.** Uwzględnia Twoje ustawienia (pauzę, harmonogramy, tryby prywatności i język) oraz tworzy Rich Presence.
3. **Aplikacja desktopowa ją odbiera.** Rozszerzenie przesyła dane do aplikacji desktopowej Nowly przez natywną komunikację — kanał łączący przeglądarkę z programem na tym samym komputerze.
4. **Discord otrzymuje ją lokalnie.** Aplikacja desktopowa przekazuje dane aplikacji Discorda przez lokalne połączenie.
5. **Discord ją udostępnia.** Następnie aplikacja Discorda wysyła dane na serwery Discorda, aby mogli je zobaczyć Twoi znajomi, zgodnie z polityką prywatności Discorda.

Kroki od 1 do 4 odbywają się wyłącznie na Twoim komputerze. Serwery Nowly nie uczestniczą w tej drodze.

## Co odczytuje obecność

Obecność odczytuje tylko stronę, dla której powstała, i tylko dane potrzebne do wyświetlenia Twojego statusu. Obecność YouTube odczytuje tytuł filmu, kanał, adres miniatury i pozycję odtwarzania. Obecność Spotify odczytuje utwór odtwarzany w przeglądarce. Obecność nie odczytuje innych kart, historii przeglądania, pól formularzy ani haseł.

Niektóre strony udostępniają szczegóły wyłącznie przez własne dane. Na przykład obecność Netflixa pyta stronę Netflixa o tytuł i odcinek odtwarzanego materiału z wnętrza karty Netflixa, tak samo jak robi to sama strona.

## Grafiki i serwer pośredniczący obrazów

Discord musi pobrać obrazy wyświetlane w Twoim statusie. Grafiki większości platform są publiczne i Discord pobiera je bezpośrednio. Niektórych, na przykład plakatów Netflixa, Discord nie może pobrać w ich pierwotnej postaci. Wtedy obecność korzysta z serwera pośredniczącego obrazów Nowly: adres obrazu przechodzi przez API Nowly, które pobiera obraz, by Discord mógł go wyświetlić.

Ten adres może wiązać się z oglądanym tytułem, więc warto o tym wiedzieć. Serwer pośredniczący służy tylko do tego celu, nigdy do tworzenia profili reklamowych. Jego dzienniki są przechowywane wyłącznie tak długo, jak potrzeba do utrzymania i zabezpieczenia usługi.

## Co pozostaje na Twoim komputerze

- Zainstalowane obecności, ich ustawienia i stan włączenia.
- Twoja bieżąca aktywność: tytuł, platforma, czas trwania i adres grafiki.
- Dziennik diagnostyczny z ostatnimi działaniami i adresami odwiedzonych obsługiwanych stron, pomocny przy rozwiązywaniu problemów.
- Dziennik aplikacji desktopowej, `nowly-host.log`, w jej folderze pamięci podręcznej.
- Lokalna kopia Twojej nazwy użytkownika i awatara Discorda, pobrana z aplikacji Discorda, by wyświetlać je w rozszerzeniu.

Wszystko to zostaje usunięte po zresetowaniu lub odinstalowaniu rozszerzenia, a dziennik aplikacji desktopowej możesz usunąć w dowolnym momencie.

## Uprawnienia prostymi słowami

- **Dostęp do stron internetowych**: lekki skrypt sprawdza, czy otwarta strona należy do obsługiwanej platformy, aby panel boczny mógł zaproponować właściwą obecność. Nie wysyła nigdzie Twojej historii przeglądania.
- **Skrypty użytkownika**: pozwalają zainstalowanym obecnościom działać na przypisanych im stronach. Zobacz [Dlaczego Nowly prosi o zgodę na skrypty użytkownika](/guides/allow-user-scripts).
- **Natywna komunikacja**: pozwala rozszerzeniu rozmawiać z aplikacją desktopową na Twoim komputerze.
- **Pamięć**: przechowuje ustawienia i obecności w przeglądarce.

## Co może trafić do Nowly, ale tylko jeśli tak zdecydujesz

- **Statystyki użytkowania** są domyślnie wyłączone. Jeśli je włączysz, API Nowly otrzymuje losowy identyfikator urządzenia, informacje o przeglądarce, systemie, języku i wersjach oraz zdarzenia takie jak instalacje. Nigdy nie otrzymuje Twoich stron, tytułów, wyszukiwań ani tożsamości na Discordzie.
- **Konto** jest opcjonalne. Jeśli zalogujesz się przez Discorda, ustawienia i lista zainstalowanych obecności będą synchronizowane między Twoimi przeglądarkami. Bieżąca aktywność, karty i historia nigdy nie są synchronizowane.
- **Polubienia i zgłoszenia** wysłane ze strony obecności trafiają do API Nowly razem z treścią Twojego zgłoszenia.
- **Pobieranie obecności** z biblioteki łączy się z serwerami i siecią CDN Nowly, tak jak każde pobieranie.

## Twoje dane pod Twoją kontrolą

- Strona [Twoje dane](/consent) pozwala włączać i wyłączać statystyki oraz eksportować lub usuwać wszystko, co przechowujemy dla Twojego urządzenia.
- Na [stronie konta](/account) możesz pobrać dane konta albo usunąć konto.
- Odinstalowanie rozszerzenia usuwa wszystkie dane zapisane przez nie lokalnie.

## Co robi z nimi Discord

Gdy Twoja aktywność dotrze do Discorda, Discord pokaże ją osobom uprawnionym do oglądania Twojego profilu i przetworzy zgodnie z własną polityką prywatności. Nowly nie może zmienić tego etapu, ale możesz zdecydować, jakie dane zostaną w ogóle wysłane: zobacz [Wybierz dokładnie, co Discord pokazuje o Tobie](/guides/control-what-discord-shows).
