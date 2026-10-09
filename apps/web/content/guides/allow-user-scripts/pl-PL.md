---
title: Dlaczego Nowly prosi o zgodę na skrypty użytkownika i jak ją wyrazić
description: Czym jest uprawnienie do skryptów użytkownika, dlaczego obecności go potrzebują, jak włączyć je w Chrome, Edge, Brave, Operze i Firefoksie oraz na co nie pozwala.
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Podczas konfiguracji Nowly prosi o uprawnienie, którego większość rozszerzeń nie potrzebuje: możliwość uruchamiania skryptów użytkownika. Brzmi technicznie, a ostrzeżenie przeglądarki może budzić niepokój. Ten poradnik wyjaśnia, czego naprawdę dotyczy to uprawnienie, dlaczego Nowly z niego korzysta i jak je włączyć w każdej obsługiwanej przeglądarce.

## Czym jest skrypt użytkownika

Skrypt użytkownika to niewielki fragment JavaScriptu uruchamiany na otwartej przez Ciebie stronie internetowej, obok jej własnego kodu. Przeglądarki od dawna obsługują takie skrypty dzięki dodatkom takim jak Tampermonkey.

Od czasu Manifest V3, obecnego formatu rozszerzeń Chrome, przeglądarka rozróżnia dwa przypadki. Kod dołączony do pakietu rozszerzenia w sklepie jest sprawdzany wraz z rozszerzeniem. Kod dodany przez rozszerzenie później, już po instalacji, jest traktowany jako skrypt użytkownika i może zostać uruchomiony dopiero po Twojej wyraźnej zgodzie. Firefox stosuje podobne rozwiązanie z własnym komunikatem o uprawnieniach.

## Dlaczego obecności są skryptami użytkownika

Każda obecność Nowly to kod rozumiejący działanie jednej strony: gdzie YouTube umieszcza tytuł filmu, jak Netflix udostępnia numer odcinka, kiedy Spotify odtwarza muzykę, a kiedy jest wstrzymane. Takich obecności jest ponad 40, a układ stron często się zmienia.

Gdyby wszystkie obecności były wbudowane w rozszerzenie, każda poprawka wymagałaby nowej wersji rozszerzenia i ponownej oceny w sklepie, a Ty pobierałbyś kod dla dziesiątek stron, których nigdy nie odwiedzasz. Zamiast tego rozszerzenie pozostaje niewielkie, a obecności instaluje się osobno z [biblioteki](/library):

- Instalujesz tylko integracje z platformami, których używasz.
- Niedziałającą obecność można poprawić i ponownie opublikować w ciągu kilku godzin, bez aktualizacji rozszerzenia.
- Obecność działa tylko pod przypisanymi jej adresami. Na przykład obecność YouTube działa pod `www.youtube.com` i `m.youtube.com`, ale nigdzie indziej.

## Jak Nowly dba o bezpieczeństwo obecności

Uruchamianie pobranego kodu to właśnie powód, dla którego przeglądarka najpierw pyta o zgodę. Nowly dodaje do tego własne zabezpieczenia:

- Każda oficjalna obecność jest podpisywana przez zespół Nowly kluczem ECDSA P-256. Przed zarejestrowaniem skryptu rozszerzenie sprawdza podpis oraz skróty SHA-256 pakietu kodu i jego metadanych. Skrypt zmieniony po podpisaniu zostaje odrzucony.
- Kod źródłowy każdej obecności jest publiczny, więc każdy może go przeczytać przed instalacją.
- Obecności przekazują wykryte informacje rozszerzeniu, które przesyła je do aplikacji desktopowej na Twoim komputerze, a następnie do Discorda. Żaden etap tej drogi nie prowadzi przez serwery Nowly, a kod obecności jest sprawdzany przed podpisaniem.
- Niepodpisane pakiety są akceptowane wyłącznie przez ręcznie załadowane wersje programistyczne, nigdy przez wersję ze sklepu.

## Jak włączyć uprawnienie w Chrome, Edge, Brave i Operze

1. Otwórz stronę rozszerzeń: `chrome://extensions` w Chrome, `edge://extensions` w Edge, `brave://extensions` w Brave lub `opera://extensions` w Operze.
2. Znajdź **Nowly** i kliknij **Szczegóły**.
3. Włącz **Zezwalaj na skrypty użytkownika**.
4. Odśwież karty stron, których aktywność chcesz pokazywać na Discordzie.

W starszych wersjach Chrome i przeglądarek opartych na Chromium przełącznik **Zezwalaj na skrypty użytkownika** jeszcze nie istnieje. Skrypty włącza się wtedy przełącznikiem **Tryb dewelopera** w prawym górnym rogu strony rozszerzeń. Nie zmienia to sposobu aktualizowania ani weryfikowania sklepowej wersji Nowly.

## Jak włączyć uprawnienie w Firefoksie

Podczas pierwszej konfiguracji Nowly Firefox jednorazowo poprosi o uprawnienie. Zaakceptuj prośbę i gotowe.

Jeśli ją odrzuciłeś, otwórz `about:addons`, wybierz **Nowly**, przejdź do karty **Uprawnienia** i zezwól na skrypty użytkownika. Następnie odśwież karty stron, których aktywność chcesz pokazywać.

## Jak sprawdzić, czy zadziałało

Otwórz panel boczny Nowly skrótem **Ctrl+Shift+Y** (**Cmd+Shift+Y** na Macu). W diagnostyce punkt **Skrypty użytkownika dozwolone** powinien być teraz zielony. Gdy tak się stanie, Nowly zarejestruje zainstalowane obecności; na obsługiwanej stronie sprawdź następnie punkt **Wykryto aktywność**.

Jeśli mimo włączenia uprawnienia punkt nadal jest czerwony:

- Załaduj rozszerzenie ponownie ze strony rozszerzeń albo uruchom przeglądarkę ponownie.
- Sprawdź, czy zmieniłeś ustawienie Nowly, a nie innego rozszerzenia.
- Jeśli przeglądarką zarządza szkoła lub firma, jej zasady mogą blokować skrypty użytkownika we wszystkich rozszerzeniach.

## Na co to uprawnienie nie pozwala

Zgoda na skrypty użytkownika nie daje Nowly dostępu do Twoich haseł, innych rozszerzeń ani plików. Pozwala rozszerzeniu rejestrować skrypty dla określonych stron, a przeglądarka nadal egzekwuje listę adresów każdego skryptu. Nowly nie korzysta z tego uprawnienia, by odczytywać strony nieobsługiwane przez żadną zainstalowaną obecność.

Możesz wycofać zgodę w dowolnym momencie. Obecności przestaną wtedy działać, a Discord przestanie pokazywać Twoją aktywność, ale nic nie zostanie usunięte: po ponownym włączeniu uprawnienia wszystko wróci do poprzedniego stanu.

## W skrócie

Dzięki skryptom użytkownika Nowly może obsługiwać dziesiątki stron za pomocą niewielkiego rozszerzenia, szybko aktualizować obecności i pozwalać Ci instalować tylko te, których potrzebujesz. Zgodę wyraża się raz w każdej przeglądarce, a każda korzystająca z niej obecność jest podpisana, ma publiczny kod i działa tylko na swoich stronach.
