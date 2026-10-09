---
title: Jak skonfigurować Nowly i pokazywać swoją aktywność na Discordzie
description: Pełny przewodnik od rozszerzenia przeglądarki przez aplikację desktopową po pierwszą obecność i sprawdzenie, czy wszystko działa.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly pokazuje na Discordzie, co oglądasz, czego słuchasz lub jakie strony przeglądasz. Wykorzystuje do tego Rich Presence, czyli kartę pod Twoją nazwą z tytułem, grafiką, paskiem postępu, a czasem także przyciskiem. Konfiguracja zajmuje około pięciu minut i wymaga trzech elementów: rozszerzenia przeglądarki, niewielkiej aplikacji desktopowej oraz osobnej obecności dla każdej strony, którą chcesz pokazywać. Ten poradnik przeprowadzi Cię przez wszystkie kroki i pomoże sprawdzić, czy wszystko jest połączone.

## Czego potrzebujesz na początek

- **Komputer** z Windows 10 lub 11, macOS 11 Big Sur lub nowszym albo 64-bitową dystrybucją Linuksa.
- **Przeglądarka** Chrome, Edge, Brave, Opera, inna oparta na Chromium albo Firefox.
- **Aplikacja desktopowa Discorda**, zainstalowana i z zalogowanym kontem. Discord w karcie przeglądarki lub na telefonie nie może odbierać Rich Presence od innego programu, więc nie zadziała z Nowly.

Nie potrzebujesz konta Nowly. Wszystko opisane poniżej jest bezpłatne.

## Krok 1: zainstaluj rozszerzenie przeglądarki

Otwórz [stronę rozszerzenia](/extension) w przeglądarce, której używasz na co dzień. Przycisk prowadzi do właściwego sklepu: Chrome Web Store w Chrome, Edge, Brave i Operze lub Firefox Add-ons w Firefoksie. Kliknij **Dodaj**, potwierdź instalację i przypnij ikonę Nowly do paska narzędzi, aby była zawsze pod ręką.

Nowly działa w panelu bocznym przeglądarki (w Firefoksie: na pasku bocznym). Otwórz go ikoną na pasku narzędzi albo skrótem **Ctrl+Shift+Y** (**Cmd+Shift+Y** na Macu). Przy pierwszym uruchomieniu zobaczysz krótkie wprowadzenie do każdego kroku. Możesz skorzystać z niego lub czytać dalej: kroki są takie same.

## Krok 2: zezwól na skrypty użytkownika

Każda obecność to niewielki skrypt uruchamiany tylko na stronie, dla której powstał. Przeglądarki nazywają je skryptami użytkownika i wymagają Twojej zgody na ich uruchamianie.

- **Chrome, Edge, Brave, Opera**: otwórz `chrome://extensions` (lub odpowiednio `edge://extensions`, `brave://extensions`, `opera://extensions`), znajdź Nowly, kliknij **Szczegóły** i włącz **Zezwalaj na skrypty użytkownika**. W starszych wersjach Chrome tego przełącznika jeszcze nie ma: zamiast tego włącz **Tryb dewelopera** w prawym górnym rogu strony rozszerzeń.
- **Firefox**: podczas pierwszej konfiguracji pojawi się jednorazowa prośba o uprawnienie. Zaakceptuj ją.

Więcej o tym, na co pozwala to uprawnienie, przeczytasz w poradniku [Dlaczego Nowly prosi o zgodę na skrypty użytkownika](/guides/allow-user-scripts).

## Krok 3: zainstaluj aplikację desktopową

Discord przyjmuje Rich Presence tylko od programu działającego na tym samym komputerze, przez lokalne połączenie, którego strony internetowe i rozszerzenia nie mogą nawiązać samodzielnie. Tym programem jest aplikacja desktopowa Nowly (w rozszerzeniu widoczna jako Nowly Desktop). Nie ma własnego okna: przeglądarka uruchamia ją, gdy jest potrzebna, a ona przekazuje Twoją aktywność do Discorda.

Otwórz [stronę aplikacji desktopowej](/desktop). Wykryje Twój system i zaproponuje odpowiedni plik.

- **Windows**: uruchom instalator. Ta wersja nie jest jeszcze podpisana płatnym certyfikatem, dlatego Windows SmartScreen może wyświetlić ostrzeżenie. Wybierz **Więcej informacji**, a potem **Uruchom mimo to**, ale tylko w przypadku pliku pobranego z nowly.me.
- **macOS**: otwórz obraz dysku i postępuj zgodnie z instrukcjami. Aplikacja została notarialnie poświadczona przez Apple, więc Gatekeeper ją zaakceptuje.
- **Linux**: na Debianie, Ubuntu lub Mincie zainstaluj pakiet `.deb`. Na innych dystrybucjach pobierz archiwum i uruchom zawarty w nim skrypt instalacyjny. Jeśli coś pójdzie nie tak, zobacz [Nowly na Linuksie](/guides/nowly-on-linux).

## Krok 4: uruchom Discorda i sprawdź ustawienia aktywności

Uruchom aplikację desktopową Discorda i pozostaw ją otwartą. Sprawdź też, czy Discord może pokazywać Twoją aktywność: otwórz **Ustawienia użytkownika**, potem **Prywatność aktywności** i upewnij się, że udostępnianie bieżącej aktywności jest włączone. Dokładne brzmienie zmienia się między wersjami Discorda, ale chodzi o przełącznik dotyczący aktywności lub komunikatu o statusie.

Pamiętaj też, że gdy masz status **Niewidoczny**, nikt nie zobaczy Twojej aktywności, niezależnie od tego, co wyśle Nowly.

## Krok 5: zainstaluj pierwszą obecność

Obecności znajdziesz w [bibliotece](/library). YouTube najlepiej nadaje się na pierwszy test, bo film można uruchomić w kilka sekund:

1. Otwórz [obecność YouTube](/library/youtube).
2. Poczekaj, aż strona wykryje rozszerzenie, i kliknij **Zainstaluj**.
3. Otwórz film w YouTube i rozpocznij odtwarzanie.

Obecności możesz też instalować bez wychodzenia z panelu bocznego: karta **Biblioteka** w rozszerzeniu zawiera ten sam katalog. Podpis cyfrowy każdej obecności jest weryfikowany przed instalacją.

## Krok 6: odczytaj diagnostykę

Otwórz panel boczny Nowly. Diagnostyka pokazuje sześć punktów, które zmieniają kolor na zielony, gdy są gotowe:

| Kontrola | Co oznacza |
| --- | --- |
| Rozszerzenie zainstalowane | Rozszerzenie działa w tej przeglądarce. |
| Skrypty użytkownika dozwolone | Przeglądarka pozwala Nowly uruchamiać obecności. |
| Wykryto Nowly Desktop | Aplikacja desktopowa odpowiedziała rozszerzeniu. |
| Discord połączony | Aplikacja desktopowa połączyła się z Discordem. |
| Obecność zainstalowana | Zainstalowano co najmniej jedną obecność. |
| Wykryto aktywność | Obecność znalazła coś do pokazania w bieżącej karcie. |

Gdy wszystkie sześć punktów jest zielonych, spójrz na swój profil na Discordzie: powinno być widać **Ogląda YouTube** wraz z tytułem filmu, kanałem, miniaturą i paskiem postępu. Jeśli któryś punkt pozostaje czerwony, zajmij się najpierw nim: wskazuje następne brakujące ogniwo. [Lista kroków rozwiązywania problemów](/guides/rich-presence-not-showing) obejmuje wszystkie przypadki.

## Co widzą Twoi znajomi

Podczas odtwarzania filmu obecność YouTube pokazuje jego tytuł, nazwę kanału, miniaturę i upływający czas oraz przycisk **Obejrzyj film**. Gdy wstrzymasz odtwarzanie, ikonę odtwarzania zastępuje ikona pauzy. Przeglądanie strony głównej YouTube lub wyników wyszukiwania domyślnie niczego nie pokazuje: większość obecności udostępnia tylko to, co naprawdę oglądasz lub czego słuchasz, a pokazywanie przeglądanych stron włącza się osobno dla każdej obecności.

## Co dalej

- Dodaj z [biblioteki](/library) platformy, których naprawdę używasz: Netflix, Twitch, Crunchyroll, Spotify i ponad 40 innych.
- Dowiedz się, jak wstrzymać udostępnianie, ukryć kartę lub udostępniać aktywność tylko o wybranych porach, w poradniku [Wybierz dokładnie, co Discord pokazuje o Tobie](/guides/control-what-discord-shows).
- Chcesz wiedzieć, jak to działa od środka? Przeczytaj [Czym jest Discord Rich Presence?](/guides/what-is-discord-rich-presence).
