---
title: Qué puede ver Nowly y adónde van tus datos
description: El recorrido de tu actividad desde una página web hasta Discord, qué lee una presencia, qué permanece en tu ordenador y las pocas funciones opcionales que sí contactan con Nowly.
category: privacy
order: 2
updated: 2026-10-09
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Una herramienta que sabe lo que ves debe responder con claridad a una pregunta sencilla: ¿adónde va esa información? Esta guía sigue tu actividad paso a paso, enumera lo que permanece en tu dispositivo y explica sin rodeos las pocas funciones opcionales que sí se comunican con los servidores de Nowly. Acompaña en lenguaje sencillo a la [política de privacidad](/privacy), que sigue siendo la referencia.

## La respuesta breve

Tu actividad va de la página web a la aplicación de Discord en tu propio ordenador, y a ningún otro sitio. Nunca pasa por nowly.me ni por la API de Nowly. Las estadísticas de uso están desactivadas a menos que las actives, y la cuenta es opcional.

## El recorrido de tu actividad

Esto es lo que ocurre cuando inicias la reproducción en un sitio web compatible:

1. **La presencia lee la página.** La presencia de ese sitio se ejecuta en la pestaña del navegador y lee lo necesario: un título, un número de episodio, el nombre de un canal o si el vídeo se está reproduciendo.
2. **La extensión prepara la actividad.** Aplica tus ajustes (pausa, horarios, modos de privacidad e idioma) y crea la Rich Presence.
3. **La aplicación de escritorio la recibe.** La extensión se la envía a la aplicación de escritorio de Nowly mediante mensajería nativa, un canal entre el navegador y un programa del mismo ordenador.
4. **Discord la recibe en local.** La aplicación de escritorio se la pasa a la aplicación de Discord mediante su conexión local.
5. **Discord la comparte.** Desde ahí, la aplicación de Discord la envía a los servidores de Discord para que tus amigos puedan verla, bajo la política de privacidad de Discord.

Los pasos del 1 al 4 ocurren íntegramente en tu ordenador. Los servidores de Nowly no intervienen en ese recorrido.

## Qué lee una presencia

Una presencia solo lee la página para la que fue escrita y solo lo que necesita para tu estado. La presencia de YouTube lee el título del vídeo, el canal, la dirección de la miniatura y la posición de reproducción. La de Spotify lee la canción que se reproduce en el navegador. Una presencia no lee otras pestañas, tu historial de navegación, campos de formularios ni contraseñas.

Algunos sitios web solo exponen los detalles a través de sus propios datos. La presencia de Netflix, por ejemplo, consulta al propio sitio web de Netflix el título y el episodio que se están reproduciendo, desde dentro de la pestaña de Netflix, igual que hace la propia página.

## Imágenes y servidor intermediario

Discord tiene que descargar las imágenes que aparecen en tu estado. Las de la mayoría de las plataformas son públicas y Discord las carga directamente. Algunas, como los carteles de Netflix, no puede cargarlas tal cual. En esos casos, la presencia utiliza el servidor intermediario de imágenes de Nowly: la dirección de la imagen pasa por la API de Nowly, que la descarga para que Discord pueda mostrarla.

Esa dirección puede estar relacionada con el título que ves, así que conviene saberlo. El servidor intermediario se utiliza solo con ese fin, nunca para crear perfiles publicitarios, y sus registros se conservan únicamente el tiempo necesario para prestar y proteger el servicio.

## Qué permanece en tu ordenador

- Tus presencias instaladas, sus ajustes y si están activadas.
- Tu actividad actual: título, plataforma, duración y dirección de la imagen.
- Un registro de depuración con acciones recientes y direcciones de páginas compatibles que has visitado, útil cuando algo falla.
- El registro de la aplicación de escritorio, `nowly-host.log`, en su carpeta de caché.
- Una copia local de tu nombre y avatar de Discord, tomada de la aplicación de Discord para mostrarlos en la extensión.

Todo ello se borra al restablecer o desinstalar la extensión; puedes borrar el registro de la aplicación de escritorio en cualquier momento.

## Los permisos, sin tecnicismos

- **Acceso a sitios web**: un script ligero comprueba si la página que abres pertenece a una plataforma compatible, para que el panel lateral pueda sugerirte la presencia adecuada. No envía tu historial de navegación a ninguna parte.
- **Scripts de usuario**: permite ejecutar las presencias instaladas en sus propios sitios web. Consulta [Por qué Nowly te pide permitir los scripts de usuario](/guides/allow-user-scripts).
- **Mensajería nativa**: permite que la extensión se comunique con la aplicación de escritorio en tu ordenador.
- **Almacenamiento**: conserva tus ajustes y presencias en el navegador.

## Qué puede llegar a Nowly, solo si tú lo decides

- Las **estadísticas de uso** están desactivadas por defecto. Si las activas, la API de Nowly recibe un identificador aleatorio del dispositivo, tu navegador, sistema, idioma y versiones, y eventos como instalaciones. Nunca recibe tus páginas, títulos, búsquedas ni identidad de Discord.
- La **cuenta** es opcional. Si inicias sesión con Discord, tus ajustes y la lista de presencias instaladas se sincronizan entre navegadores. Tu actividad actual, pestañas e historial nunca se sincronizan.
- Los **«Me gusta» e informes** que envías desde la página de una presencia llegan a la API de Nowly, junto con el texto que escribiste en el informe.
- **Descargar presencias** de la biblioteca contacta con los servidores y la CDN de Nowly, como cualquier descarga.

## Tus datos bajo tu control

- La página [Tus datos](/consent) te permite activar o desactivar las estadísticas, así como exportar o borrar todo lo almacenado para tu dispositivo.
- La [página de la cuenta](/account) te permite descargar los datos de tu cuenta o eliminarla.
- Al desinstalar la extensión se borra todo lo que guardó localmente.

## Qué hace Discord con ellos

Cuando tu actividad llega a Discord, Discord la muestra a quienes tienen permiso para ver tu perfil y la trata conforme a su propia política de privacidad. Nowly no puede cambiar esa parte, pero tú sí puedes decidir qué se envía desde el principio: consulta [Elige exactamente qué muestra Discord sobre ti](/guides/control-what-discord-shows).
