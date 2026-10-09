---
title: ¿Qué es Discord Rich Presence? Cómo funciona y qué puede mostrar
description: La tarjeta bajo tu nombre en Discord, desde los tipos y campos de actividad hasta la conexión local que utilizan los programas para actualizarla y por qué los sitios web necesitan ayuda.
category: discord
order: 1
updated: 2026-10-09
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Si has visto que en el perfil de Discord de un amigo aparece **Jugando** a un juego, con una imagen, un temporizador y un botón **Unirse**, ya has visto Rich Presence. Es la función que permite a un programa describir con detalle lo que haces, en vez de limitarse a mostrar su nombre. Esta guía explica qué contiene una Rich Presence, cómo la envían los programas a Discord y por qué se necesita una herramienta como Nowly para mostrar un sitio web.

## Del nombre de un juego a una actividad detallada

Discord empezó detectando el juego que tenías abierto y escribiendo su nombre bajo el tuyo. Rich Presence, creada para desarrolladores de videojuegos, va más allá: el propio programa comunica a Discord lo que está pasando, por ejemplo el mapa, la puntuación o el número de jugadores en tu grupo, y actualiza la información cuando cambia.

El mismo mecanismo sirve para cualquier cosa, no solo para juegos. Lo utilizan reproductores de música, editores de código y herramientas de streaming; Nowly lo utiliza para sitios web.

## Qué contiene una tarjeta de Rich Presence

Una Rich Presence consta de unos pocos campos. No todos los programas rellenan todos.

| Campo | Qué muestra | Ejemplo con YouTube |
| --- | --- | --- |
| Tipo de actividad | El verbo delante del nombre | Viendo |
| Nombre | La aplicación | YouTube |
| Detalles | La primera línea | El título del vídeo |
| Estado | La segunda línea | El nombre del canal |
| Imagen grande | La imagen principal, con texto al pasar el cursor | La miniatura del vídeo |
| Imagen pequeña | Un distintivo en una esquina de la imagen | Un icono de reproducción o pausa |
| Marcas de tiempo | Tiempo transcurrido o una barra de progreso con inicio y fin | 14:10 de 26:48 |
| Botones | Hasta dos enlaces que otras personas pueden abrir | Ver vídeo |

El tipo de actividad puede ser **Jugando**, **Escuchando**, **Viendo** o **Compitiendo**. Por eso una presencia de música indica **Escuchando Spotify** y una de vídeo, **Viendo Netflix**.

## Cómo se comunican los programas con Discord

Rich Presence no pasa primero por internet. Al iniciarse, la aplicación de escritorio de Discord abre un canal local en tu ordenador: una canalización con nombre llamada `discord-ipc-0` en Windows, o un archivo de socket con el mismo nombre en macOS y Linux. El programa que quiera mostrar tu actividad:

1. se conecta a ese canal;
2. se identifica con un ID de aplicación registrado en Discord, que da nombre e imágenes a la actividad;
3. envía los campos de la actividad;
4. envía actualizaciones cuando algo cambia o retira la actividad cuando terminas.

A continuación, la aplicación de Discord publica la actividad en tu perfil mediante los servidores de Discord, para que tus amigos la vean desde cualquier dispositivo.

Como el canal es local, solo pueden usarlo programas que se ejecuten en el mismo ordenador que la aplicación de escritorio de Discord. Discord en una pestaña del navegador o en el móvil no lo abre.

## Por qué los sitios web necesitan ayuda

Un sitio web no puede abrir ese canal local. Los navegadores aíslan deliberadamente las páginas web del sistema, y las extensiones también están aisladas. Así que, aunque el navegador sepa qué vídeo reproduces, no tiene forma de decírselo directamente a Discord.

Nowly cubre esa distancia:

- una **presencia** lee la página en tu navegador y prepara la actividad;
- la **extensión del navegador** la recoge y aplica tus ajustes;
- la **aplicación de escritorio** es el programa de tu ordenador que abre el canal local de Discord y envía la actividad.

La aplicación de escritorio es pequeña, no tiene ventana y el navegador la inicia cuando hace falta. Sin ella, una extensión por sí sola no puede actualizar Rich Presence.

## Quién puede ver tu Rich Presence

Tu actividad aparece en tu perfil y en las listas de miembros para quienes pueden ver tu estado: tus amigos y los miembros de servidores que compartís, salvo que desactives el envío de actividad en **Privacidad de la actividad** de Discord o para un servidor concreto. Si tu estado es **Invisible**, nadie la verá.

Los botones están pensados para otras personas: permiten que tus amigos abran el mismo vídeo o episodio.

## Límites que conviene conocer

- **Una actividad por aplicación a la vez.** Si varios programas actualizan tu actividad, Discord puede mostrar uno, varios o alternar entre ellos. Evita ejecutar dos herramientas que muestren lo mismo.
- **Las actualizaciones tienen un límite de frecuencia.** Discord acepta un número limitado de actualizaciones en poco tiempo, por lo que el estado puede ir unos segundos por detrás de la página. Las marcas de tiempo permiten que Discord cuente el tiempo por sí solo sin recibir actualizaciones constantes.
- **Discord debe poder acceder a las imágenes.** Las descarga Discord, no tu ordenador, así que las imágenes privadas o protegidas necesitan un servidor intermediario. Consulta [Qué puede ver Nowly](/guides/what-nowly-can-see) para saber cómo las gestiona Nowly.

## Rich Presence y las conexiones integradas de Discord

Discord también muestra algunas actividades sin programas adicionales cuando vinculas una cuenta en **Conexiones**, como Spotify. Esas integraciones funcionan de otra manera y tienen sus ventajas e inconvenientes. Encontrarás la comparación en [Conexiones de Discord o Nowly](/guides/discord-connections-vs-nowly).
