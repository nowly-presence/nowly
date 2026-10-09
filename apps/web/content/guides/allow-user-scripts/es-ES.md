---
title: Por qué Nowly te pide permitir los scripts de usuario y cómo hacerlo
description: Qué es el permiso de scripts de usuario, por qué lo necesitan las presencias, cómo activarlo en Chrome, Edge, Brave, Opera y Firefox, y qué no permite.
category: start
order: 2
updated: 2026-10-09
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Durante la configuración, Nowly pide un permiso que la mayoría de las extensiones nunca solicitan: poder ejecutar scripts de usuario. Suena técnico y la advertencia del navegador puede imponer un poco. Esta guía explica qué abarca realmente ese permiso, por qué Nowly se basa en él y cómo activarlo en todos los navegadores compatibles.

## Qué es un script de usuario

Un script de usuario es un pequeño fragmento de JavaScript que se ejecuta en una página web que abres, además del código propio de esa página. Los navegadores llevan mucho tiempo admitiéndolos mediante complementos como Tampermonkey.

Con Manifest V3, el formato actual de las extensiones de Chrome, Chrome establece una distinción clara. El código incluido en el paquete de la extensión publicado en la tienda se revisa junto con ella. El código que una extensión añade después de instalarse se considera un script de usuario y el navegador solo lo ejecuta cuando lo has permitido expresamente. Firefox sigue el mismo principio mediante su propia solicitud de permiso.

## Por qué las presencias son scripts de usuario

Cada presencia de Nowly es el código que sabe cómo funciona un sitio web: dónde coloca YouTube el título del vídeo, cómo expone Netflix el número de episodio o cuándo Spotify está reproduciendo o en pausa. Hay más de 40 y los sitios web cambian de diseño con frecuencia.

Si todas las presencias estuvieran integradas en la extensión, cada corrección exigiría una versión nueva y otra revisión de la tienda; además, llevarías código para decenas de sitios que nunca visitas. En cambio, la extensión sigue siendo pequeña y las presencias se instalan por separado desde la [biblioteca](/library):

- Instalas únicamente las plataformas que utilizas.
- Una presencia que deja de funcionar puede corregirse y publicarse de nuevo en cuestión de horas, sin actualizar la extensión.
- Una presencia solo se ejecuta en las direcciones indicadas para ella. La de YouTube, por ejemplo, funciona en `www.youtube.com` y `m.youtube.com`, y en ningún otro sitio.

## Cómo protege Nowly las presencias

Precisamente por tratarse de código descargado, los navegadores piden permiso antes de ejecutarlo. Nowly añade sus propias comprobaciones:

- El equipo de Nowly firma cada presencia oficial con una clave ECDSA P-256. Antes de registrar un script, la extensión comprueba la firma y los hashes SHA-256 del paquete y sus metadatos. Si el script se modifica después de firmarlo, se rechaza.
- El código fuente de todas las presencias es público, así que cualquiera puede ver qué hace una presencia antes de instalarla.
- Las presencias entregan lo que encuentran a la extensión, que lo envía a la aplicación de escritorio en tu ordenador y, de allí, a Discord. Ninguna parte de ese recorrido pasa por los servidores de Nowly, y el código de las presencias se revisa antes de firmarse.
- Los paquetes sin firmar solo se aceptan en versiones de desarrollo cargadas manualmente, nunca en la versión de la tienda.

## Cómo activarlo en Chrome, Edge, Brave y Opera

1. Abre la página de extensiones: `chrome://extensions` en Chrome, `edge://extensions` en Edge, `brave://extensions` en Brave u `opera://extensions` en Opera.
2. Busca **Nowly** y haz clic en **Detalles**.
3. Activa **Permitir scripts de usuario**.
4. Recarga las pestañas de los sitios web cuya actividad quieres mostrar en Discord.

En versiones antiguas de Chrome y otros navegadores Chromium, todavía no existe el interruptor **Permitir scripts de usuario**. En ese caso, los scripts de usuario se activan con **Modo de desarrollador**, en la esquina superior derecha de la página de extensiones. Activarlo no cambia la forma en que se actualiza o verifica la versión de Nowly de la tienda.

## Cómo activarlo en Firefox

Firefox te lo pregunta una vez durante la introducción de Nowly, mediante su propio aviso de permisos. Acéptalo y listo.

Si cerraste el aviso, abre `about:addons`, selecciona **Nowly**, entra en la pestaña **Permisos** y concede el permiso de scripts de usuario. Después, recarga las pestañas cuya actividad quieras mostrar.

## Comprueba que ha funcionado

Abre el panel lateral de Nowly con **Ctrl+Shift+Y** (**Cmd+Shift+Y** en Mac). En el diagnóstico, la fila **Scripts de usuario permitidos** debería ponerse verde. En cuanto lo haga, Nowly registrará las presencias que hayas instalado; la siguiente fila que debes comprobar en una página compatible es **Actividad detectada**.

Si la fila sigue roja después de conceder el permiso:

- Recarga la extensión desde la página de extensiones o reinicia el navegador.
- Comprueba que cambiaste el ajuste de Nowly y no el de otra extensión.
- Si tu navegador está administrado por un centro educativo o una empresa, sus políticas pueden bloquear los scripts de usuario de todas las extensiones.

## Qué no permite este permiso

Permitir los scripts de usuario no da a Nowly acceso a tus contraseñas, otras extensiones ni archivos. Permite que la extensión registre scripts para sitios web concretos, y el navegador sigue aplicando la lista de direcciones permitidas para cada uno. Nowly no lo utiliza para leer páginas que no admita ninguna presencia instalada.

Puedes revocar el permiso cuando quieras. Las presencias dejarán de ejecutarse y Discord dejará de mostrar tu actividad, pero no se borrará nada: vuelve a concederlo y todo seguirá como antes.

## En resumen

Los scripts de usuario permiten que Nowly admita decenas de sitios web con una extensión pequeña, actualice las presencias rápidamente e instale solo lo que necesitas. El permiso se concede una vez por navegador, y cada presencia que lo utiliza está firmada, tiene código público y se limita a sus propios sitios web.
