---
title: Muestra lo que ves en Discord (Netflix, Prime Video, Disney+ y más)
description: Cómo mostrar la serie o película que estás viendo en tu estado de Discord, qué enseña cada presencia de streaming y por qué funciona incluso cuando compartir pantalla da una imagen negra.
category: start
order: 3
updated: 2026-10-09
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

Discord muestra a qué juegas sin tener que configurar nada, pero no las series que ves en el navegador. Con Nowly, tu perfil puede indicar **Viendo Netflix** junto con el título, el episodio, el cartel y el progreso de reproducción; tus amigos pueden abrir el mismo episodio con un clic. Esta guía explica cómo configurarlo para los servicios de streaming y qué esperar de cada uno.

## Qué necesitas

Si todavía no has configurado Nowly, sigue primero [Cómo configurar Nowly](/guides/set-up-nowly): necesitas la extensión, los scripts de usuario, la aplicación de escritorio y la aplicación de escritorio de Discord. Después, instala una presencia por cada servicio que utilices desde la [biblioteca](/library). Hay presencias para Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ y ADN, entre otros.

## Lo que verán tus amigos

Una presencia de streaming rellena la tarjeta de Rich Presence con lo que aparece en pantalla. Con Netflix, por ejemplo:

- **Viendo Netflix** en la parte superior.
- El título de la serie o película en la primera línea.
- En las series, la temporada y el episodio, en formato `S1.E3`, seguidos del título del episodio. En las películas, el año.
- El cartel como imagen principal y un distintivo de reproducción o pausa.
- Durante la reproducción, el tiempo transcurrido y el que falta.
- Un botón **Ver episodio** o **Ver película** con el que tus amigos pueden abrir el mismo título.

Prime Video y Disney+ funcionan de forma parecida y muestran la temporada y el episodio cuando aparecen en el reproductor. Crunchyroll muestra la serie, el título del episodio y una portada, y añade un botón que lleva a la página de la serie.

## Ver contenido no es navegar

Por defecto, las presencias de streaming se centran en lo que hay en el reproductor, para que tu estado no cambie cada vez que dudas entre dos series. Hay algunas diferencias:

- **Netflix** no muestra nada hasta que se reproduce un título: la página de inicio, las búsquedas y las páginas de títulos permanecen privadas.
- **Prime Video** y **Disney+** también muestran la página del título que estás consultando, como **Viendo detalles** o **Viendo una serie**, con su nombre. El inicio, las búsquedas y las listas permanecen privados.
- **Crunchyroll** también muestra páginas principales, como las de series, el calendario de estrenos simultáneos, tu lista de seguimiento o una búsqueda. Activa su **Modo de privacidad** para ocultar los títulos.

Si quieres mostrar más, activa **Mostrar actividad de navegación** en los ajustes de la presencia, dentro del panel lateral. Entonces tu estado te seguirá por la página de inicio, las listas y las búsquedas, donde puede mostrar lo que has escrito.

## Por qué funciona cuando compartir pantalla no funciona

Si has intentado compartir pantalla en Discord mientras veías Netflix, seguramente habrás visto un rectángulo negro en vez del vídeo. Los servicios de streaming protegen sus vídeos con DRM y los navegadores excluyen el contenido protegido de las capturas de pantalla.

Rich Presence es otra cosa: nunca envía el vídeo, solo texto y un cartel que lo describen. Por eso funciona con todos estos servicios y no incumple las normas de la plataforma. Si quieres verlo con otras personas, utiliza la función de visionado en grupo del servicio, si dispone de ella, y deja que tu estado de Discord cuente a tus amigos qué estás viendo.

## Reserva algunas cosas para ti

No todas las noches necesitas público. Tienes varias opciones rápidas:

- **Pausa todo** con **Ctrl+Shift+U** (**Cmd+Shift+U** en Mac) y vuelve a pulsarlo para reanudar.
- Usa **Ocultar esta pestaña** en el panel lateral para mantener una pestaña privada mientras las demás siguen compartiéndose.
- **Pausa temporalmente** una presencia durante una hora, cuatro horas o hasta mañana.
- **Comparte solo a ciertas horas** mediante un horario, para todas las presencias o solo las de streaming.
- En **Crunchyroll**, activa el **Modo de privacidad** para ocultar el título sin dejar de mostrar que estás viendo contenido.

Encontrarás todos los detalles en [Elige exactamente qué muestra Discord sobre ti](/guides/control-what-discord-shows).

## Si tu estado sigue vacío

- Asegúrate de que el título se esté reproduciendo realmente en el navegador, no en una aplicación de televisión o en tu móvil.
- Comprueba que estés en una dirección admitida por la presencia: Prime Video funciona en `primevideo.com` y Netflix en `netflix.com`.
- Recarga la pestaña una vez después de instalar una presencia.

Para los demás casos, la [lista de comprobaciones para solucionar problemas](/guides/rich-presence-not-showing) repasa todos los eslabones de la cadena.
