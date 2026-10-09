---
title: ¿No aparece Discord Rich Presence? Una lista de comprobaciones que funciona
description: ¿Tu estado de Discord sigue vacío mientras ves o escuchas contenido? Sigue estas comprobaciones en orden, desde los ajustes de Discord hasta la página en la que estás.
category: troubleshooting
order: 1
updated: 2026-10-09
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Una Rich Presence pasa por una cadena de cinco eslabones: la página que visitas, la presencia de ese sitio web, la extensión del navegador, la aplicación de escritorio y la aplicación de Discord. Si tu estado sigue vacío, falla uno de esos eslabones; encontrar cuál es la solución más rápida, en vez de reinstalarlo todo. Sigue estas comprobaciones por orden. La mayoría de los problemas se resuelven en las primeras cuatro.

## Empieza por el diagnóstico de Nowly

Abre el panel lateral de Nowly (**Ctrl+Shift+Y**, o **Cmd+Shift+Y** en Mac) en la pestaña cuya actividad quieres compartir. El diagnóstico muestra seis filas: **Extensión instalada**, **Scripts de usuario permitidos**, **Nowly Desktop detectado**, **Discord conectado**, **Hay una presencia instalada** y **Actividad detectada**.

Léelas de arriba abajo y detente en la primera que no esté verde. Cada sección de abajo corresponde a una de ellas, además de algunos casos que el diagnóstico no puede detectar desde el navegador.

## 1. Estás usando la aplicación de escritorio de Discord

Rich Presence solo funciona con la aplicación de Discord instalada en tu ordenador. Discord en una pestaña del navegador, en el móvil o en otro ordenador no mostrará nada, aunque hayas iniciado sesión en la misma cuenta.

Si usas ambas versiones, cierra la de navegador: puede hacerte creer que tu estado está vacío cuando la aplicación de escritorio sí lo está mostrando a los demás.

## 2. Discord tiene permiso para mostrar tu actividad

Discord puede ocultar tu actividad incluso después de recibirla:

- Abre **Ajustes de usuario**, luego **Privacidad de la actividad**, y activa la opción de compartir tu actividad actual.
- Comprueba tu estado. **Invisible** oculta tu actividad a todo el mundo.
- Algunos servidores permiten desactivar el envío de actividad solo para ese servidor en sus ajustes de privacidad. Si un amigo de un servidor no puede verla, pero otros sí, compruébalo ahí.

Una forma rápida de distinguirlos: si tu propio perfil muestra la actividad pero un amigo no la ve, el problema está en un ajuste de privacidad de Discord, no en Nowly.

## 3. La aplicación de escritorio está instalada y en ejecución

Si **Nowly Desktop detectado** aparece en rojo, la extensión no puede contactar con la aplicación de escritorio.

- Instálala desde la [página de la aplicación de escritorio](/desktop) si aún no lo has hecho y después haz clic en **Comprobar conexión** en el panel lateral.
- Si acabas de instalarla, cierra y vuelve a abrir el panel lateral o reinicia el navegador para que detecte la nueva aplicación.
- Instala la aplicación en el mismo ordenador que el navegador. No funciona entre distintos equipos.
- En Linux, las causas más habituales son un `.deb` que en realidad nunca llegó a instalarse o un navegador instalado mediante Flatpak o Snap. Consulta [Nowly en Linux](/guides/nowly-on-linux).

## 4. Discord está conectado

Si **Nowly Desktop detectado** está en verde pero **Discord conectado** está en rojo, la aplicación de escritorio no puede comunicarse con Discord.

- Inicia la aplicación de escritorio de Discord y espera a que termine de cargar. Después haz clic en **Comprobar conexión**.
- En Windows, la causa más frecuente es que Discord se ejecute como administrador. Se arregla en un minuto: [Soluciona «Acceso denegado» en discord-ipc-0](/guides/discord-ipc-access-denied).
- Si ejecutas Discord PTB o Canary junto a la versión normal, cierra todas menos una.

## 5. Los scripts de usuario están permitidos

Si **Scripts de usuario permitidos** está en rojo, el navegador bloquea las presencias. Activa **Permitir scripts de usuario** en la página de detalles de Nowly (o **Modo de desarrollador** en versiones antiguas de Chrome) y recarga la pestaña. Encontrarás los pasos para cada navegador en [Por qué Nowly te pide permitir los scripts de usuario](/guides/allow-user-scripts).

## 6. La presencia adecuada está instalada y activada

Cada sitio web necesita su propia presencia. Si **Hay una presencia instalada** está en verde pero no ocurre nada en un sitio concreto, abre su página en la [biblioteca](/library) y comprueba que indica **Instalada**. Después, en el panel lateral:

- Comprueba que la presencia esté activada.
- Comprueba que el envío de actividad no esté en pausa. Si lo está, el panel lateral muestra **El envío de actividad está en pausa**. Reanúdalo con el botón de pausa o **Ctrl+Shift+U**.
- Comprueba que la presencia no esté pausada temporalmente y que no estés **Fuera de tu horario** si configuraste horas para compartir.
- Comprueba que la propia pestaña no esté oculta mediante **Ocultar esta pestaña**.

## 7. La presencia admite la página

**Actividad detectada** permanece en rojo cuando la presencia no tiene nada que mostrar en la página actual. Dos motivos explican casi todos los casos:

- **Estás navegando, no viendo contenido.** La mayoría de las presencias solo comparten lo que estás reproduciendo de verdad: un vídeo, un episodio, una canción o una emisión en directo. En la mayoría, la página de inicio, las búsquedas y los catálogos no muestran nada a menos que actives **Mostrar actividad de navegación** en los ajustes de esa presencia. Su página en la biblioteca explica qué muestra por defecto.
- **La dirección no es compatible.** Cada presencia enumera las direcciones en las que funciona, en **Sitios compatibles** dentro de su página en la biblioteca. Prime Video, por ejemplo, funciona en `primevideo.com`. Si el sitio cambió de dirección o de diseño, utiliza **Informar de un problema** en la página de la presencia.

Después de instalar una presencia o cambiar un ajuste, recarga la pestaña una vez. Una página abierta antes de instalar la presencia todavía no la tiene.

## 8. Otra herramienta de Rich Presence no está interfiriendo

Otras herramientas que establecen tu actividad de Discord, como PreMiD o un reproductor de música con Rich Presence propia, pueden sustituir o borrar lo que envía Nowly. Desactívalas mientras haces la prueba. Un juego al que estés jugando también puede ocupar el lugar de la actividad mostrada en tu perfil.

## 9. ¿Sigue sin aparecer nada?

- Recarga la pestaña y después reinicia el navegador y Discord. Suena básico, pero restablece todas las conexiones de la cadena.
- Actualiza la extensión, la aplicación de escritorio y Discord.
- Abre los registros de ejecución de la extensión y haz clic en **Copiar registros** para pegarlos en un ticket. Los registros pueden incluir direcciones de páginas compatibles que hayas visitado: léelos antes de compartirlos.
- Abre un ticket en el servidor de Discord de Nowly o informa del problema desde la página de la presencia en la biblioteca si solo afecta a un sitio web.

## La cadena, en una frase

La página debe ser compatible, la presencia debe estar instalada y ejecutarse, los scripts de usuario deben estar permitidos, la aplicación de escritorio debe estar accesible y Discord debe estar abierto y autorizado para mostrar tu actividad. Encuentra el primer eslabón que falle, arréglalo y lo demás suele funcionar.
