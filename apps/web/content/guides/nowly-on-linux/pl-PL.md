---
title: "Nowly na Linuksie: pakiet .deb, archiwum, Flatpak i Snap"
description: Zainstaluj aplikację desktopową Nowly na dowolnej dystrybucji, usuń pętlę komunikatu o dostępnej aktualizacji i uruchom Rich Presence z Discordem lub przeglądarką z Flatpaka albo Snapa.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly działa na Linuksie tak samo jak w Windows i macOS: rozszerzenie przeglądarki wykrywa Twoją aktywność, a aplikacja desktopowa przekazuje ją do Discorda na tym samym komputerze. Linux daje jednak kilka możliwości instalacji, a pakiety działające w piaskownicy mogą utrudnić połączenie. Ten poradnik opisuje instalację na różnych dystrybucjach oraz rozwiązania problemów, na które faktycznie trafiają użytkownicy Linuksa.

## Wymagania

- 64-bitowa dystrybucja (x64) z biblioteką glibc 2.17 lub nowszą — warunek spełnia każda współczesna popularna dystrybucja.
- Aplikacja desktopowa Discorda z pakietu `.deb` Discorda, oficjalnego archiwum, repozytorium dystrybucji, Flatpaka lub Snapa.
- Chrome, Chromium, Brave, Edge, Opera lub Firefox, najlepiej zainstalowany z repozytorium dystrybucji albo pakietu dostawcy.

## Wybierz właściwy plik

[Strona aplikacji desktopowej](/desktop) oferuje dwa pliki dla Linuksa:

- **Pakiet `.deb`** dla Debiana, Ubuntu, Linux Mint, Pop!_OS, elementary OS i innych systemów opartych na Debianie. Instaluje aplikację dla całego systemu i rejestruje ją we wszystkich obsługiwanych przeglądarkach.
- **Archiwum `.tar.gz`** dla pozostałych dystrybucji, takich jak Fedora, Arch czy openSUSE. Zawiera aplikację i skrypt instalujący ją dla Twojego użytkownika.

## Zainstaluj pakiet .deb

Na większości pulpitów dwukrotne kliknięcie pliku otwiera instalator oprogramowania. Na niektórych, na przykład XFCE z Thunarem, dwukrotne kliknięcie nic nie zrobi, jeśli nie skonfigurowano graficznego instalatora pakietów. Wtedy zainstaluj pakiet w terminalu:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Następnie sprawdź, czy rzeczywiście jest zainstalowany:

```bash
dpkg -L nowly-host
```

Na liście powinien znajdować się plik `/usr/lib/nowly-client/nowly-host`. Uruchom ponownie całą przeglądarkę, nie tylko kartę, aby znalazła nową aplikację.

## Zainstaluj aplikację z archiwum

Rozpakuj archiwum, otwórz terminal w rozpakowanym folderze i uruchom zawarty w nim skrypt instalacyjny, postępując zgodnie z wyświetlanymi instrukcjami. Skrypt kopiuje aplikację do Twojego katalogu domowego i zapisuje niewielkie pliki manifestu wskazujące przeglądarkom, gdzie ją znaleźć, na przykład `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` dla Chrome lub `~/.mozilla/native-messaging-hosts/nowly.client.json` dla Firefoksa. Po instalacji uruchom przeglądarkę ponownie.

## „Dostępna aktualizacja” zaraz po instalacji

Jeśli panel boczny Nowly informuje o dostępnej aktualizacji aplikacji desktopowej, mimo że właśnie zainstalowałeś najnowszą wersję, sprawdź po kolei dwie możliwe przyczyny:

1. **Pakiet `.deb` wcale nie został zainstalowany.** Uruchom `dpkg -L nowly-host`. Jeśli polecenie informuje, że pakiet nie jest zainstalowany, zainstaluj go z terminala, jak opisano wyżej.
2. **Starsza instalacja dla użytkownika ma pierwszeństwo.** Jeśli wcześniej używałeś archiwum, a potem przeszedłeś na `.deb`, stary manifest w katalogu domowym nadal wskazuje starą aplikację. Usuń go:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Potem całkowicie zamknij przeglądarkę i otwórz ją ponownie, aby uruchomiła aplikację desktopową z nowej lokalizacji.

## Discord z Flatpaka lub Snapa

Wersje Discorda działające w piaskownicy tworzą gniazdo Rich Presence wewnątrz własnego folderu zamiast w zwykłej lokalizacji. Aplikacja desktopowa Nowly szuka `discord-ipc-0` do `discord-ipc-9` w `$XDG_RUNTIME_DIR`, `$TMPDIR` i `/tmp`, więc może nie znaleźć Discorda z Flatpaka lub Snapa. Inne narzędzia Rich Presence mają ten sam problem; zwykłym rozwiązaniem jest dowiązanie symboliczne z oczekiwanej lokalizacji do właściwego gniazda.

Dla **Discorda z Flathuba** gniazdo znajduje się w `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Utwórz dowiązanie:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Zawartość `$XDG_RUNTIME_DIR` jest usuwana przy każdym ponownym uruchomieniu systemu, więc dowiązanie również znika. Aby odtwarzać je automatycznie przy każdym logowaniu, użyj systemd:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Dla **Discorda ze Snap Store** gniazdo zwykle znajduje się w `$XDG_RUNTIME_DIR/snap.discord/`. Podobne dowiązanie rozwiązuje problem:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Uruchom Discorda przed utworzeniem dowiązania, a potem kliknij **Sprawdź połączenie** w panelu bocznym Nowly.

## Przeglądarka z Flatpaka lub Snapa

Przeglądarka uruchamia aplikację desktopową Nowly przez natywną komunikację. Przeglądarki działające w piaskownicy ograniczają programy, które mogą uruchamiać; zależnie od pakietu i jego wersji natywna komunikacja może być całkowicie zablokowana. Objawem jest punkt **Wykryto Nowly Desktop**, który nigdy nie zmienia koloru na zielony, niezależnie od tego, co instalujesz.

Najpewniejszym rozwiązaniem jest przeglądarka z repozytorium dystrybucji albo własnego pakietu `.deb` lub `.rpm` dostawcy, zamiast wersji z Flatpaka lub Snapa. Zakładki i hasła wrócą po zalogowaniu się na konto przeglądarki.

## Powiadomienia i dzienniki

Jeśli Discord blokuje połączenie z powodu uprawnień, aplikacja desktopowa może pokazać powiadomienie przez `notify-send`, o ile środowisko pulpitu ma usługę powiadomień.

Aplikacja desktopowa zapisuje dziennik w `~/.cache/NowlyClient/nowly-host.log`. Może on zawierać aktywność wysłaną do Discorda, dlatego przeczytaj go przed dołączeniem do zgłoszenia pomocy. Możesz go usunąć w dowolnym momencie.

## Lista kontrolna

- `dpkg -L nowly-host` pokazuje pliki aplikacji albo skrypt instalacyjny z archiwum zakończył się bez błędów.
- Nie pozostał żaden manifest starszej instalacji.
- Discord działa, a jego gniazdo jest dostępne przez `$XDG_RUNTIME_DIR` lub `/tmp`.
- Przeglądarka nie pochodzi z Flatpaka ani Snapa albo natywna komunikacja w niej działa.

Jeśli wszystkie cztery warunki są spełnione, a Nowly nadal nie może połączyć się z Discordem, przejdź przez [listę kroków rozwiązywania problemów](/guides/rich-presence-not-showing). Otwórz zgłoszenie na serwerze Discord Nowly, podając dystrybucję, środowisko pulpitu oraz sposób instalacji Discorda i przeglądarki.
