---
title: Soluciona «Acceso denegado» en discord-ipc-0 (Windows)
description: Por qué Windows bloquea la conexión entre Nowly y Discord si Discord se ejecuta como administrador y los cinco pasos para solucionarlo definitivamente.
category: troubleshooting
order: 2
updated: 2026-10-09
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

En Windows, a veces Nowly muestra **Nowly Desktop detectado** en verde, pero **Discord conectado** en rojo, y en los registros aparece una línea como esta:

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly también puede mostrar un mensaje que explica que Discord bloquea la conexión, y la aplicación de escritorio puede enviar una notificación de Windows. La causa es casi siempre la misma y no se trata de un fallo de Nowly ni de Discord: Discord se está ejecutando con permisos de administrador y tu navegador, no.

## Qué es discord-ipc-0

Los programas que quieren establecer tu actividad de Discord, incluidos los juegos, se comunican con la aplicación de Discord mediante un canal local llamado canalización con nombre. En Windows, la primera se llama `\\.\pipe\discord-ipc-0`. Discord la crea al iniciarse y la aplicación de escritorio de Nowly la abre para enviar tu actividad.

En este paso no se envía nada por internet. Es una conversación entre dos programas del mismo ordenador.

## Por qué Windows dice «Acceso denegado»

Windows separa los programas que se ejecutan como administrador de los normales. Un programa iniciado con **Ejecutar como administrador** funciona con un nivel de integridad superior; los objetos que crea, incluida la canalización de Discord, quedan protegidos frente a los programas que funcionan con el nivel normal.

Tu navegador se ejecuta con el nivel normal, así que la aplicación de escritorio de Nowly que inicia también. Si Discord se inició como administrador, Windows impide que la aplicación con el nivel normal abra la canalización elevada y la conexión falla con **Acceso denegado**.

Los juegos y otras herramientas de Rich Presence se encuentran exactamente con el mismo obstáculo. Por eso «Discord no muestra mi juego» y este error suelen aparecer juntos.

## La solución, paso a paso

1. **Cierra Discord por completo.** No basta con cerrar la ventana: haz clic con el botón derecho en el icono de Discord del área de notificaciones, junto al reloj, y elige **Salir de Discord**.
2. **Asegúrate de que no quede ningún proceso de Discord.** Abre el Administrador de tareas con **Ctrl+Shift+Esc** y finaliza cualquier proceso `Discord.exe` que siga abierto.
3. **Quita la opción de administrador.** Haz clic con el botón derecho en el acceso directo de Discord que utilizas, elige **Propiedades**, abre la pestaña **Compatibilidad** y desmarca **Ejecutar este programa como administrador**. Todavía en **Propiedades**, entra en la pestaña **Acceso directo**, haz clic en **Opciones avanzadas** y asegúrate de que **Ejecutar como administrador** también esté desmarcado. Si el botón **Cambiar la configuración para todos los usuarios** muestra la opción marcada, desmárcala allí también.
4. **Inicia Discord de manera normal**, con un doble clic.
5. **Vuelve a conectar Nowly.** Haz clic en **Reconectar** en el panel lateral de Nowly o reinicia el navegador.

**Discord conectado** debería ponerse verde y tu actividad aparecer en unos segundos.

## Si Discord sigue iniciándose como administrador

- Revisa todos los accesos directos que utilizas: el del escritorio, el del menú Inicio y el de la barra de tareas. Cada uno tiene sus propios ajustes.
- Si Discord se inicia con Windows, puede abrirlo una tarea programada o un gestor de inicio de terceros configurado para utilizar los privilegios más altos. Quita esa opción o vuelve a crear la entrada sin ella.
- Algunas personas ejecutan Discord como administrador para que la función de pulsar para hablar funcione dentro de juegos que también se ejecutan como administrador. En ese caso, tienes que elegir: o ejecutas Discord y el juego sin permisos de administrador, o Rich Presence del navegador no podrá llegar a Discord.

## Qué no debes hacer

No ejecutes el navegador como administrador ni fuerces a la aplicación de escritorio de Nowly a hacerlo para esquivar el problema. Los navegadores inician la aplicación por sí mismos mediante un mecanismo llamado mensajería nativa. Ejecutar el navegador con todos los permisos de administrador expone todo tu sistema a cualquier problema que ocurra en una página web. La solución correcta es siempre devolver Discord al nivel normal.

## Discord PTB y Canary

En Windows, la aplicación de escritorio de Nowly se conecta a la primera canalización de Discord, `discord-ipc-0`. Si ejecutas Discord Stable y Discord PTB o Canary al mismo tiempo, la aplicación que se inició primero se queda con esa canalización y tu actividad solo aparece en ella. Mantén abierta una sola aplicación de Discord para evitar sorpresas.

## ¿Sigue bloqueado?

Si el error ha desaparecido pero tu estado sigue vacío, el problema está en otro eslabón de la cadena. Vuelve a la [lista de comprobaciones para solucionar problemas](/guides/rich-presence-not-showing) y continúa por el paso **Scripts de usuario permitidos**. Si los registros siguen indicando **Access is denied** después de completar estos pasos, abre un ticket en el servidor de Discord de Nowly e indica tu versión de Windows y cómo inicias Discord.
