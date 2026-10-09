---
title: Cómo configurar Nowly y mostrar tu actividad en Discord
description: Una guía completa, desde la extensión del navegador hasta la aplicación de escritorio, tu primera presencia y las comprobaciones para confirmar que todo funciona.
category: start
order: 1
updated: 2026-10-09
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly muestra lo que ves, escuchas o consultas en sitios web como una Rich Presence de Discord: la tarjeta bajo tu nombre con un título, una imagen, una barra de progreso y, a veces, un botón. Configurarlo lleva unos cinco minutos y requiere tres elementos: una extensión del navegador, una pequeña aplicación de escritorio y una presencia por cada sitio web cuya actividad quieras mostrar. Esta guía los explica por orden y termina con las comprobaciones que confirman que todo está conectado.

## Qué necesitas antes de empezar

- **Un ordenador**: Windows 10 u 11, macOS 11 Big Sur o posterior, o una distribución de Linux de 64 bits.
- **Un navegador**: Chrome, Edge, Brave, Opera u otro navegador basado en Chromium, o Firefox.
- **La aplicación de escritorio de Discord**, instalada y con la sesión iniciada. Discord en una pestaña del navegador o en el móvil no puede recibir una Rich Presence de otro programa, así que no funcionará con Nowly.

No necesitas una cuenta de Nowly. Todo lo que sigue es gratuito.

## Paso 1: instala la extensión del navegador

Abre la [página de la extensión](/extension) desde el navegador que usas habitualmente. El botón te lleva a la tienda correspondiente: Chrome Web Store para Chrome, Edge, Brave y Opera, o Firefox Add-ons para Firefox. Haz clic en **Añadir**, confirma y fija el icono de Nowly en la barra de herramientas para tenerlo siempre a mano.

Nowly se encuentra en el panel lateral del navegador (la barra lateral en Firefox). Ábrelo con el icono de la barra de herramientas o con **Ctrl+Shift+Y** (**Cmd+Shift+Y** en Mac). La primera vez, una breve introducción explica cada paso. Puedes seguirla o continuar leyendo aquí: los pasos son los mismos.

## Paso 2: permite los scripts de usuario

Cada presencia es un pequeño script que solo se ejecuta en el sitio web para el que se escribió. Los navegadores los llaman scripts de usuario y piden tu permiso antes de ejecutarlos.

- **Chrome, Edge, Brave y Opera**: abre `chrome://extensions` (o `edge://extensions`, `brave://extensions`, `opera://extensions`), busca Nowly, haz clic en **Detalles** y activa **Permitir scripts de usuario**. En versiones antiguas de Chrome aún no existe ese interruptor: activa **Modo de desarrollador** en la esquina superior derecha de la página de extensiones.
- **Firefox**: la introducción te pide el permiso una sola vez. Acéptalo.

Si quieres saber exactamente qué permite este permiso, lee [Por qué Nowly te pide permitir los scripts de usuario](/guides/allow-user-scripts).

## Paso 3: instala la aplicación de escritorio

Discord solo acepta una Rich Presence de un programa que se ejecute en el mismo ordenador, mediante una conexión local que los sitios web y las extensiones no pueden abrir por sí solos. La aplicación de escritorio de Nowly (Nowly Desktop en la extensión) es ese programa. No tiene ventana: el navegador la inicia cuando Nowly la necesita y ella envía tu actividad a Discord.

Abre la [página de la aplicación de escritorio](/desktop). Detecta tu sistema y te ofrece el archivo adecuado.

- **Windows**: ejecuta el instalador. La versión todavía no está firmada con un certificado de pago, así que Windows SmartScreen puede mostrar una advertencia. Elige **Más información** y después **Ejecutar de todas formas**, pero solo si descargaste el archivo de nowly.me.
- **macOS**: abre la imagen de disco y sigue las instrucciones. Apple ha notarizado la aplicación, por lo que Gatekeeper la acepta.
- **Linux**: en Debian, Ubuntu o Mint, instala el paquete `.deb`. En otras distribuciones, descarga el archivo comprimido y ejecuta el script de instalación que contiene. Si algo falla, consulta [Nowly en Linux](/guides/nowly-on-linux).

## Paso 4: abre Discord y comprueba sus ajustes de actividad

Inicia la aplicación de escritorio de Discord y déjala abierta. Después, comprueba que Discord puede mostrar tu actividad: entra en **Ajustes de usuario**, luego en **Privacidad de la actividad**, y asegúrate de que esté activada la opción para compartir tu actividad actual. El texto exacto varía entre versiones de Discord, pero es el interruptor que menciona tu actividad o tu mensaje de estado.

Recuerda también que, si tu estado es **Invisible**, nadie verá tu actividad, independientemente de lo que envíe Nowly.

## Paso 5: instala tu primera presencia

Las presencias están en la [biblioteca](/library). YouTube es la mejor primera prueba porque puedes empezar a reproducir un vídeo en segundos:

1. Abre la [presencia de YouTube](/library/youtube).
2. Espera a que la página detecte la extensión y haz clic en **Instalar**.
3. Abre un vídeo en YouTube y reprodúcelo.

También puedes instalar presencias sin salir del panel lateral: la pestaña **Biblioteca** de la extensión muestra el mismo catálogo. Cada presencia se verifica mediante una firma digital antes de instalarse.

## Paso 6: consulta el diagnóstico

Abre el panel lateral de Nowly. El diagnóstico muestra seis comprobaciones, que se ponen verdes cuando están listas:

| Comprobación | Qué significa |
| --- | --- |
| Extensión instalada | La extensión funciona en este navegador. |
| Scripts de usuario permitidos | El navegador permite a Nowly ejecutar presencias. |
| Nowly Desktop detectado | La aplicación de escritorio ha respondido a la extensión. |
| Discord conectado | La aplicación de escritorio se ha conectado a Discord. |
| Hay una presencia instalada | Hay al menos una presencia instalada. |
| Actividad detectada | Una presencia ha encontrado algo que mostrar en la pestaña actual. |

Cuando las seis estén verdes, mira tu perfil de Discord: deberías ver **Viendo YouTube** con el título del vídeo, el canal, la miniatura y una barra de progreso. Si alguna fila sigue roja, resuelve primero ese problema: es siempre el siguiente eslabón de la cadena. La [lista de comprobaciones para solucionar problemas](/guides/rich-presence-not-showing) cubre todos los casos.

## Lo que ven tus amigos

Con la presencia de YouTube, un vídeo en reproducción muestra su título, el nombre del canal, la miniatura y el tiempo transcurrido, además de un botón **Ver vídeo**. Al ponerlo en pausa, un icono de pausa sustituye al de reproducción. Por defecto, recorrer la página de inicio de YouTube o buscar no muestra nada: la mayoría de las presencias solo comparten lo que realmente ves o escuchas, y compartir la actividad de navegación es una opción que se activa por presencia.

## Qué hacer después

- Añade las plataformas que utilizas de verdad desde la [biblioteca](/library): Netflix, Twitch, Crunchyroll, Spotify y más de 40 opciones adicionales.
- Aprende a pausar, ocultar una pestaña o compartir solo a ciertas horas en [Elige exactamente qué muestra Discord sobre ti](/guides/control-what-discord-shows).
- ¿Quieres saber qué ocurre entre bastidores? Lee [¿Qué es Discord Rich Presence?](/guides/what-is-discord-rich-presence).
