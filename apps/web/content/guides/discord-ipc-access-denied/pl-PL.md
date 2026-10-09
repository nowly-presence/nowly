---
title: Usuń błąd „Odmowa dostępu” przy discord-ipc-0 (Windows)
description: Dlaczego Windows blokuje połączenie Nowly z Discordem uruchomionym jako administrator i jak trwale rozwiązać problem w pięciu krokach.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

W Windows Nowly czasami pokazuje **Wykryto Nowly Desktop** na zielono, ale **Discord połączony** na czerwono, a w dzienniku widnieje taki wpis:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly może też wyświetlić komunikat o tym, że Discord blokuje połączenie, a aplikacja desktopowa może pokazać powiadomienie systemu Windows. Przyczyna prawie zawsze jest taka sama i nie wynika z błędu Nowly ani Discorda: Discord działa z uprawnieniami administratora, a przeglądarka nie.

## Czym jest discord-ipc-0

Programy, które chcą ustawiać Twoją aktywność na Discordzie — także gry — komunikują się z aplikacją Discorda przez lokalny kanał zwany potokiem nazwanym. W Windows pierwszy taki kanał nazywa się `\\.\pipe\discord-ipc-0`. Discord tworzy go przy uruchomieniu, a aplikacja desktopowa Nowly otwiera go, żeby przesłać Twoją aktywność.

Na tym etapie nic nie trafia do internetu. Komunikują się dwa programy na tym samym komputerze.

## Dlaczego Windows zgłasza „Odmowa dostępu”

Windows oddziela programy uruchomione jako administrator od zwykłych programów. Program uruchomiony za pomocą **Uruchom jako administrator** działa z wyższym poziomem integralności, a utworzone przez niego obiekty — w tym potok nazwany Discorda — są chronione przed programami działającymi na zwykłym poziomie.

Przeglądarka działa na zwykłym poziomie, więc uruchomiona przez nią aplikacja desktopowa Nowly również. Jeśli Discord został uruchomiony jako administrator, Windows nie pozwoli aplikacji działającej na zwykłym poziomie otworzyć potoku o podwyższonych uprawnieniach. Połączenie zakończy się błędem **Odmowa dostępu**.

Gry i inne narzędzia Rich Presence napotykają dokładnie tę samą przeszkodę, dlatego komunikat „Discord nie pokazuje mojej gry” często towarzyszy temu błędowi.

## Rozwiązanie krok po kroku

1. **Zamknij Discorda całkowicie.** Zamknięcie okna nie wystarczy: kliknij prawym przyciskiem myszy ikonę Discorda w obszarze powiadomień obok zegara i wybierz **Zakończ Discord**.
2. **Upewnij się, że nie działa żaden proces Discorda.** Otwórz Menedżera zadań skrótem **Ctrl+Shift+Esc** i zakończ pozostałe procesy `Discord.exe`.
3. **Wyłącz uruchamianie jako administrator.** Kliknij prawym przyciskiem myszy używany skrót Discorda, wybierz **Właściwości**, otwórz kartę **Zgodność** i odznacz **Uruchom ten program jako administrator**. Nadal we **Właściwościach**, na karcie **Skrót**, kliknij **Zaawansowane** i sprawdź, czy **Uruchom jako administrator** też jest odznaczone. Jeśli opcja jest zaznaczona również pod przyciskiem **Zmień ustawienia dla wszystkich użytkowników**, odznacz ją tam.
4. **Uruchom Discorda normalnie**, zwykłym dwukrotnym kliknięciem.
5. **Połącz Nowly ponownie.** Kliknij **Połącz ponownie** w panelu bocznym Nowly albo uruchom przeglądarkę ponownie.

**Discord połączony** powinno teraz zmienić kolor na zielony, a Twoja aktywność pojawić się w ciągu kilku sekund.

## Jeśli Discord nadal uruchamia się jako administrator

- Sprawdź każdy używany skrót: na pulpicie, w menu Start i na pasku zadań. Każdy może mieć własne ustawienia.
- Jeśli Discord uruchamia się wraz z Windowsem, może startować z zadania harmonogramu albo zewnętrznego menedżera autostartu skonfigurowanego z najwyższymi uprawnieniami. Wyłącz tę opcję lub utwórz wpis ponownie bez niej.
- Niektórzy uruchamiają Discorda jako administrator, aby funkcja „naciśnij i mów” działała w grach uruchomionych jako administrator. W takiej sytuacji musisz wybrać: Discord i gra działają bez podwyższonych uprawnień albo Rich Presence z przeglądarki nie może połączyć się z Discordem.

## Czego nie robić

Nie uruchamiaj przeglądarki jako administrator ani nie wymuszaj tego dla aplikacji desktopowej Nowly, by obejść problem. Przeglądarki same uruchamiają aplikację desktopową przez mechanizm natywnej komunikacji. Uruchomienie przeglądarki z pełnymi uprawnieniami administratora naraża cały system na skutki błędów na stronach internetowych. Prawidłowym rozwiązaniem jest zawsze uruchomienie Discorda ze zwykłymi uprawnieniami.

## Discord PTB i Canary

W Windows aplikacja desktopowa Nowly łączy się z pierwszym potokiem Discorda, `discord-ipc-0`. Jeśli jednocześnie uruchomisz stabilną wersję Discorda oraz Discord PTB lub Canary, program uruchomiony jako pierwszy będzie właścicielem tego potoku, a Twoja aktywność pojawi się tylko w nim. Aby uniknąć niespodzianek, pozostaw otwartą tylko jedną aplikację Discorda.

## Nadal zablokowane?

Jeśli błąd zniknął, ale status nadal jest pusty, problem leży dalej w łańcuchu. Wróć do [listy kroków rozwiązywania problemów](/guides/rich-presence-not-showing) i kontynuuj od kroku **Skrypty użytkownika dozwolone**. Jeśli po wykonaniu powyższych czynności w dzienniku nadal widnieje **Access is denied**, otwórz zgłoszenie na serwerze Discord Nowly, podając wersję Windows i sposób uruchamiania Discorda.
