---
title: Pokaż na Discordzie, co oglądasz (Netflix, Prime Video, Disney+ i inne)
description: Jak wyświetlać oglądany serial lub film w statusie Discorda, co pokazują obecności serwisów streamingowych i dlaczego działa to nawet wtedy, gdy udostępnianie ekranu daje czarny obraz.
category: start
order: 3
updated: 2026-10-09
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

Discord domyślnie pokazuje grę, w którą grasz, ale nie serial oglądany w przeglądarce. Dzięki Nowly na Twoim profilu może pojawić się **Ogląda Netflix** wraz z tytułem, numerem odcinka, plakatem i postępem odtwarzania. Twoi znajomi mogą też jednym kliknięciem otworzyć ten sam odcinek. Ten poradnik wyjaśnia, jak skonfigurować to dla serwisów streamingowych i czego spodziewać się po każdej integracji.

## Czego potrzebujesz

Jeśli Nowly nie jest jeszcze skonfigurowane, najpierw przeczytaj [Jak skonfigurować Nowly](/guides/set-up-nowly): potrzebne są rozszerzenie, skrypty użytkownika, aplikacja desktopowa Nowly i aplikacja desktopowa Discorda. Następnie zainstaluj z [biblioteki](/library) obecność dla każdego używanego serwisu. Dostępne są między innymi Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ i ADN.

## Co zobaczą Twoi znajomi

Obecność serwisu streamingowego wypełnia kartę Rich Presence informacjami o tym, co jest na ekranie. Na przykład w przypadku Netflixa zobaczą:

- **Ogląda Netflix** u góry.
- Tytuł serialu lub filmu w pierwszym wierszu.
- W przypadku serialu sezon i odcinek, zapisane jako `S1.E3`, oraz tytuł odcinka. W przypadku filmu: rok produkcji.
- Plakat jako główny obraz i ikonę odtwarzania lub pauzy.
- Podczas odtwarzania: czas, który minął, i czas pozostały do końca.
- Przycisk **Obejrzyj odcinek** lub **Obejrzyj film**, który otworzy znajomym ten sam tytuł.

Prime Video i Disney+ działają podobnie, pokazując sezon i odcinek, jeśli są widoczne w odtwarzaczu. Crunchyroll pokazuje serial, tytuł odcinka i okładkę oraz dodaje przycisk prowadzący do strony serialu.

## Pokazywanie oglądania, nie przeglądania

Obecności serwisów streamingowych domyślnie skupiają się na tym, co odtwarzasz, więc status nie zmienia się za każdym razem, gdy zastanawiasz się nad wyborem serialu. Szczegóły nieco się różnią:

- **Netflix** niczego nie pokazuje, dopóki nie rozpoczniesz odtwarzania. Strona główna, wyszukiwanie i strony tytułów pozostają prywatne.
- **Prime Video** i **Disney+** pokazują także otwartą stronę tytułu jako **Przegląda szczegóły** lub **Przegląda serial** wraz z jego nazwą. Strona główna, wyszukiwanie i listy pozostają prywatne.
- **Crunchyroll** pokazuje również swoje główne strony, na przykład stronę serialu, kalendarz simulcastów, listę do obejrzenia lub wyszukiwanie. Włącz **Tryb prywatności**, aby ukryć tytuły.

Jeśli chcesz pokazywać więcej, w ustawieniach obecności w panelu bocznym włącz **Pokazuj aktywność przeglądania**. Twój status będzie wtedy odzwierciedlał poruszanie się po stronie głównej, listach i wynikach wyszukiwania; może też pokazać wpisaną przez Ciebie frazę.

## Dlaczego działa to mimo ograniczeń udostępniania ekranu

Jeśli próbowałeś udostępnić ekran na Discordzie podczas oglądania Netflixa, prawdopodobnie zamiast filmu zobaczyłeś czarny prostokąt. Serwisy streamingowe chronią wideo zabezpieczeniami DRM, a przeglądarki nie umieszczają chronionego obrazu w zrzutach ekranu.

Rich Presence działa inaczej: nie przesyła filmu, tylko tekst i plakat, które go opisują. Dlatego działa z każdym serwisem i nie narusza jego zasad. Jeśli chcecie oglądać razem, skorzystajcie z funkcji wspólnego oglądania oferowanej przez platformę, jeśli ją ma, a niech status na Discordzie informuje znajomych, co oglądasz.

## Zachowaj niektóre rzeczy dla siebie

Nie każdy wieczór musi być publiczny. Masz kilka szybkich możliwości:

- **Wstrzymaj całe udostępnianie** skrótem **Ctrl+Shift+U** (**Cmd+Shift+U** na Macu); naciśnij go ponownie, aby wznowić.
- **Ukryj tę kartę** w panelu bocznym, aby jedna karta pozostała prywatna, a pozostałe nadal były udostępniane.
- **Uśpij** obecność na godzinę, cztery godziny lub do jutra.
- **Udostępniaj tylko o wybranych porach** według harmonogramu dla wszystkich obecności albo tylko streamingowych.
- W **Crunchyroll** włącz **Tryb prywatności**, aby ukryć tytuł, ale nadal pokazywać, że oglądasz.

Szczegóły znajdziesz w poradniku [Wybierz dokładnie, co Discord pokazuje o Tobie](/guides/control-what-discord-shows).

## Jeśli Twój status pozostaje pusty

- Upewnij się, że materiał rzeczywiście jest odtwarzany w przeglądarce, a nie w aplikacji na telewizorze lub telefonie.
- Sprawdź, czy jesteś pod adresem obsługiwanym przez obecność: Prime Video działa na `primevideo.com`, a Netflix na `netflix.com`.
- Po zainstalowaniu obecności odśwież kartę.

W innych przypadkach [lista kroków rozwiązywania problemów](/guides/rich-presence-not-showing) pomoże Ci sprawdzić każde ogniwo połączenia.
