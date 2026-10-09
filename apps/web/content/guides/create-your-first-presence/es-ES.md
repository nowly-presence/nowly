---
title: Crea tu primera presencia de Nowly
description: De una carpeta vacía a una actividad de Discord funcional: las herramientas necesarias, los archivos de una presencia, un primer script, las pruebas locales y cómo publicarla.
category: developers
order: 1
updated: 2026-10-09
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Cada plataforma de la biblioteca de Nowly existe porque alguien escribió una presencia para ella. Si falta un sitio web que utilizas, puedes añadirlo tú. Una presencia es un pequeño proyecto de TypeScript, normalmente de menos de cien líneas en su primera versión, y la CLI de Nowly se encarga de crear la estructura, compilar y probar en local. Esta guía te lleva desde cero hasta una presencia que actualiza tu estado de Discord. Encontrarás la referencia completa en la [documentación de Nowly](https://docs.nowly.me/).

## Qué necesitas

- **Node.js 22 o posterior** y **pnpm** para ejecutar la CLI y compilar presencias.
- **Git** para clonar el repositorio de presencias y abrir una solicitud de incorporación de cambios.
- **Un navegador Chromium o Firefox** y la **aplicación de escritorio de Discord**, con la [aplicación de escritorio de Nowly](/desktop) instalada, para hacer pruebas reales.
- Conocimientos básicos de JavaScript o TypeScript y las herramientas de desarrollo del navegador para inspeccionar la página a la que te diriges.

## Obtén el repositorio y la CLI

Todas las presencias de la comunidad están en un repositorio público bajo la licencia MIT:

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` también enlaza el paquete `@nowly/sdk`, que proporciona a tu editor los tipos de la API de presencias.

## Crea la estructura de una presencia

```bash
nowly init "Example"
```

La CLI hace algunas preguntas y crea una carpeta en `src/E/Example/`, según la primera letra de la plataforma:

- `metadata.json`: nombre, autor, direcciones admitidas, categoría, color, descripciones y ajustes de la presencia.
- `presence.ts`: el código que lee la página y establece la actividad.
- `locales/`: los textos que se muestran en Discord, con un archivo por idioma.
- `assets/`: logotipo, icono y miniatura utilizados en Discord y en la biblioteca.

La CLI también pregunta si Discord ya muestra esa plataforma a través de una cuenta vinculada. Si es así, marca la presencia para que la biblioteca pueda informar a los usuarios.

## Describe la plataforma en metadata.json

Los campos más importantes son las direcciones. `url` enumera los nombres de host y `regExp` es el patrón que debe cumplir una dirección para que se ejecute la presencia. Restríngelos tanto como permita el sitio: una presencia nunca debería ejecutarse en páginas que no entiende.

`category` debe ser uno de los valores `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` u `other`. Las descripciones se escriben por idioma y, si falta alguna, se utiliza el inglés.

## Escribe tu primera presencia

El entorno de ejecución proporciona `Presence` y `Assets`. Del SDK solo se importan utilidades como `PresenceType`:

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData` se ejecuta periódicamente mientras la página está abierta y cada vez que el usuario cambia un ajuste. En cada ejecución, lee la página y envía la actividad. Cuando no haya nada que merezca mostrarse, llama a `presence.clearActivity()` en lugar de enviar un estado vacío.

Para contenido multimedia, `createMediaTimestamps(video)` del SDK convierte un elemento `audio` o `video` en las horas de inicio y fin que Discord necesita para una barra de progreso.

## Respeta a quienes la utilizan

Las presencias de la biblioteca siguen unas reglas con las que cuentan los usuarios:

- Muestra lo que el usuario realmente hace, no todas las páginas que visita. Supedita las páginas de navegación a un ajuste **Mostrar actividad de navegación**, desactivado por defecto.
- Ofrece una opción de privacidad si el contenido puede ser personal: un modo que oculte los títulos o que mantenga las conversaciones privadas fuera de Discord.
- No envíes datos a ningún lugar aparte de la actividad ni leas más de lo necesario para crearla.
- Utiliza textos traducidos de `locales/` para todo lo que se muestre en Discord.

## Compila y prueba en local

Valida los metadatos y los recursos gráficos antes de compilar:

```bash
nowly validate
nowly build example
```

Si todavía no tienes Nowly instalado en el navegador, incluye la presencia en una extensión de desarrollo lista para usar:

```bash
nowly extension example
nowly extension example --firefox
```

Carga `dist/extension-dev` como extensión descomprimida desde `chrome://extensions`, con **Modo de desarrollador** activado; en Firefox, carga `dist/extension-dev-firefox/manifest.json` como complemento temporal desde `about:debugging`. Abre el sitio web objetivo y tu estado de Discord debería cambiar.

Si ya utilizas una versión de desarrollo descomprimida de Nowly, itera más rápido con un archivo zip:

```bash
nowly pack example
```

Después, arrastra `dist/packs/example.zip` a **Ajustes**, **Avanzado**, **Depuración** en la extensión. Los archivos zip sin firmar solo se aceptan en versiones descomprimidas, nunca en la versión de la tienda.

## Consigue que se publique

1. Ejecuta `nowly validate` una última vez y comprueba la presencia en varias páginas reales, también cuando no se esté reproduciendo nada.
2. Abre una solicitud de incorporación de cambios en el repositorio de presencias con una breve descripción y una captura del estado de Discord.
3. El equipo revisa el código, firma la versión y la publica en la biblioteca. A partir de entonces, cualquiera podrá instalarla con un clic y aparecerás como autor en su página de la biblioteca.

## Para profundizar

La documentación cubre toda la API de presencias, los ajustes, la traducción, las marcas de tiempo, los iframes y el servidor intermediario de imágenes que Discord no puede cargar directamente. Empieza con [Crear tu primera presencia](https://docs.nowly.me/presence-development/creating-your-first-presence) y ten a mano las [normas de colaboración](https://docs.nowly.me/publishing/contribution-guidelines) antes de abrir tu solicitud de incorporación de cambios.
