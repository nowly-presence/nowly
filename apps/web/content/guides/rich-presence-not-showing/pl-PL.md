---
title: Discord Rich Presence nie jest widoczne? Lista kroków, które pomogą
description: Oglądasz lub słuchasz, ale Twój status na Discordzie jest pusty? Sprawdź kolejno ustawienia Discorda i stronę, na której jesteś.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Rich Presence przechodzi przez pięć ogniw: otwartą stronę, obecność dla tej strony, rozszerzenie przeglądarki, aplikację desktopową i aplikację Discorda. Jeśli Twój status jest pusty, jedno z nich nie działa. Zamiast instalować wszystko od nowa, szybciej znajdziesz przyczynę, sprawdzając je po kolei. Wykonaj poniższe kroki w podanej kolejności. Większość problemów rozwiązuje się w pierwszych czterech.

## Zacznij od diagnostyki Nowly

Na karcie, której aktywność chcesz udostępnić, otwórz panel boczny Nowly (**Ctrl+Shift+Y** lub **Cmd+Shift+Y** na Macu). Diagnostyka pokazuje sześć punktów: **Rozszerzenie zainstalowane**, **Skrypty użytkownika dozwolone**, **Wykryto Nowly Desktop**, **Discord połączony**, **Obecność zainstalowana** i **Wykryto aktywność**.

Czytaj je od góry i zatrzymaj się przy pierwszym, który nie jest zielony. Poniższe sekcje odpowiadają poszczególnym punktom oraz kilku przypadkom, których diagnostyka przeglądarki nie potrafi wykryć.

## 1. Korzystasz z aplikacji desktopowej Discorda

Rich Presence działa tylko z aplikacją Discorda zainstalowaną na Twoim komputerze. Discord w karcie przeglądarki, na telefonie lub innym komputerze niczego nie pokaże, nawet jeśli jesteś zalogowany na to samo konto.

Jeśli korzystasz z obu wersji, zamknij Discorda w przeglądarce: może sprawiać wrażenie, że Twój status jest pusty, choć aplikacja desktopowa pokazuje go wszystkim innym.

## 2. Discord może pokazywać Twoją aktywność

Discord może ukryć aktywność, nawet jeśli ją otrzymuje:

- Otwórz **Ustawienia użytkownika**, potem **Prywatność aktywności** i włącz udostępnianie bieżącej aktywności.
- Sprawdź swój status. **Niewidoczny** ukrywa aktywność przed wszystkimi.
- Niektóre serwery pozwalają wyłączyć udostępnianie aktywności tylko na danym serwerze, w jego ustawieniach prywatności. Jeśli znajomy z jednego serwera jej nie widzi, a inni widzą, sprawdź to ustawienie.

Prosty sposób na rozróżnienie problemu: jeśli aktywność widać na Twoim własnym profilu, ale znajomy jej nie widzi, przyczyną są ustawienia prywatności Discorda, nie Nowly.

## 3. Aplikacja desktopowa jest zainstalowana i działa

Jeśli **Wykryto Nowly Desktop** jest czerwone, rozszerzenie nie może połączyć się z aplikacją desktopową.

- Jeśli jeszcze jej nie masz, zainstaluj ją ze [strony aplikacji desktopowej](/desktop), a potem kliknij **Sprawdź połączenie** w panelu bocznym.
- Jeśli właśnie ją zainstalowałeś, zamknij i ponownie otwórz panel boczny albo uruchom przeglądarkę ponownie, by wykryła nową aplikację.
- Zainstaluj aplikację na tym samym komputerze, na którym działa przeglądarka. Połączenie między komputerami nie zadziała.
- Na Linuksie najczęstszą przyczyną jest pakiet `.deb`, który w rzeczywistości nie został zainstalowany, albo przeglądarka z Flatpaka lub Snapa. Zobacz [Nowly na Linuksie](/guides/nowly-on-linux).

## 4. Discord jest połączony

Jeśli **Wykryto Nowly Desktop** jest zielone, ale **Discord połączony** jest czerwone, aplikacja desktopowa nie może skontaktować się z Discordem.

- Uruchom aplikację desktopową Discorda, poczekaj, aż w pełni się załaduje, i kliknij **Sprawdź połączenie**.
- W Windows najczęstszą przyczyną jest uruchomienie Discorda jako administrator. Naprawisz to w minutę: [Usuń błąd „Odmowa dostępu” przy discord-ipc-0](/guides/discord-ipc-access-denied).
- Jeśli oprócz zwykłego Discorda uruchamiasz Discord PTB lub Canary, zamknij wszystkie wersje oprócz jednej.

## 5. Skrypty użytkownika są dozwolone

Jeśli **Skrypty użytkownika dozwolone** jest czerwone, przeglądarka blokuje obecności. Włącz **Zezwalaj na skrypty użytkownika** na stronie szczegółów Nowly (lub **Tryb dewelopera** w starszych wersjach Chrome), a następnie odśwież kartę. Instrukcje dla poszczególnych przeglądarek znajdziesz w poradniku [Dlaczego Nowly prosi o zgodę na skrypty użytkownika](/guides/allow-user-scripts).

## 6. Właściwa obecność jest zainstalowana i włączona

Każda strona potrzebuje osobnej obecności. Jeśli **Obecność zainstalowana** jest zielone, ale na jednej stronie nic się nie dzieje, otwórz jej stronę w [bibliotece](/library) i sprawdź, czy widnieje tam **Zainstalowana**. Potem w panelu bocznym:

- Upewnij się, że obecność jest włączona.
- Sprawdź, czy udostępnianie nie jest wstrzymane. W takim przypadku panel boczny pokazuje **Udostępnianie jest wstrzymane**. Wznów je przyciskiem pauzy lub skrótem **Ctrl+Shift+U**.
- Sprawdź, czy obecność nie jest uśpiona i czy nie widzisz komunikatu **Poza harmonogramem**, jeśli ustawiłeś godziny udostępniania.
- Sprawdź, czy sama karta nie została ukryta opcją **Ukryj tę kartę**.

## 7. Obecność obsługuje tę stronę

**Wykryto aktywność** pozostaje czerwone, gdy obecność nie ma nic do pokazania na bieżącej stronie. Niemal zawsze przyczyną jest jedna z dwóch rzeczy:

- **Przeglądasz stronę, ale niczego nie oglądasz.** Większość obecności pokazuje tylko rzeczywiście odtwarzany film, odcinek, utwór lub transmisję na żywo. Zwykle strona główna, wyszukiwanie i katalogi niczego nie pokazują, dopóki w ustawieniach obecności nie włączysz **Pokazuj aktywność przeglądania**. Strona każdej obecności w bibliotece opisuje jej domyślne działanie.
- **Adres nie jest obsługiwany.** Na stronie każdej obecności w bibliotece, w sekcji **Obsługiwane strony**, znajdziesz adresy, pod którymi działa. Prime Video działa na przykład na `primevideo.com`. Jeśli serwis zmienił adres lub układ, użyj **Zgłoś problem** na stronie obecności.

Po zainstalowaniu obecności lub zmianie ustawienia odśwież kartę. Obecność nie działa jeszcze na stronie otwartej przed jej instalacją.

## 8. Inne narzędzie Rich Presence nie zakłóca działania

Inne narzędzia ustawiające aktywność na Discordzie, takie jak PreMiD lub odtwarzacz muzyki z własną funkcją Rich Presence, mogą zastąpić albo wyczyścić dane wysyłane przez Nowly. Wyłącz je na czas testów. Gra, w którą grasz, również może przejąć aktywność pokazywaną na Twoim profilu.

## 9. Nadal nic?

- Odśwież kartę, a potem uruchom ponownie przeglądarkę i Discorda. To prosty krok, ale przywraca każde połączenie w całym łańcuchu.
- Zaktualizuj rozszerzenie, aplikację desktopową i Discorda.
- Otwórz dziennik działania rozszerzenia i kliknij **Kopiuj dziennik**, aby wkleić go do zgłoszenia. Dziennik może zawierać adresy odwiedzonych przez Ciebie obsługiwanych stron, dlatego przeczytaj go przed udostępnieniem.
- Otwórz zgłoszenie na serwerze Discord Nowly. Jeśli problem dotyczy tylko jednej strony, możesz zgłosić obecność z jej strony w bibliotece.

## Cały łańcuch w jednym zdaniu

Strona musi być obsługiwana, obecność zainstalowana i uruchomiona, skrypty użytkownika dozwolone, aplikacja desktopowa dostępna, a Discord otwarty i uprawniony do pokazywania Twojej aktywności. Znajdź pierwsze niedziałające ogniwo, napraw je, a reszta zwykle zacznie działać.
