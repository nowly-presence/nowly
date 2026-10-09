---
title: "Nowly frente a PreMiD: una comparación sincera"
description: Ambas herramientas muestran la actividad de sitios web en Discord. Compara su configuración, catálogo, privacidad, seguridad y licencias para elegir según las plataformas que utilices.
category: discord
order: 3
updated: 2026-10-09
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Si buscas cómo mostrar en Discord lo que ves en el navegador, pronto encontrarás dos nombres: PreMiD, un proyecto comunitario veterano, y Nowly, una alternativa más reciente. Resuelven el mismo problema con una arquitectura básica similar, así que la elección depende de los detalles. Esta comparación intenta ser justa, también cuando PreMiD lleva ventaja.

Ambos proyectos cambian con rapidez. Los datos que siguen describen la situación en el momento de escribir estas líneas; consulta el sitio web de cada proyecto para obtener información actualizada.

## Lo que tienen en común

- **La misma arquitectura.** Una extensión del navegador lee la página y una pequeña aplicación en tu ordenador envía la actividad a la aplicación de escritorio de Discord mediante su conexión local. Ninguno funciona con Discord en una pestaña del navegador o en el móvil.
- **Integraciones por sitio web.** Ambos las llaman presencias: un script por plataforma, escrito por la comunidad, que sabe qué leer en ese sitio web.
- **Uso gratuito.** Ninguno cobra por la extensión, la aplicación de escritorio ni las presencias.

## Dónde lleva ventaja PreMiD

- **Tamaño del catálogo.** PreMiD lleva años en marcha y su comunidad ha escrito presencias para cientos de sitios web, incluidos muchos de nicho. La biblioteca de Nowly reúne hoy más de 40 plataformas, centradas en las más utilizadas.
- **Madurez y comunidad.** Años de uso han permitido detectar y corregir muchos casos especiales, y han reunido una gran comunidad de autores de presencias.

Si la plataforma que te interesa solo está en la tienda de PreMiD, PreMiD es, sencillamente, la mejor opción para ti.

## En qué se centra Nowly

- **Presencias firmadas.** El equipo firma cada presencia oficial de Nowly con una clave ECDSA P-256 y la extensión comprueba la firma y los hashes antes de ejecutarla. Los scripts modificados se rechazan.
- **Privacidad por defecto.** La actividad de navegación está desactivada por defecto en la mayoría de las presencias, varias tienen un modo de privacidad, las conversaciones temporales de ChatGPT permanecen ocultas y las estadísticas de uso están desactivadas salvo que las actives. Consulta [Qué puede ver Nowly](/guides/what-nowly-can-see).
- **Control en el día a día.** Un atajo para pausar todo, pestañas ocultas, pausas temporales de unas horas para cada presencia y horarios individuales. Consulta [Elige exactamente qué muestra Discord sobre ti](/guides/control-what-discord-shows).
- **Un diagnóstico integrado.** El panel lateral comprueba cada eslabón de la cadena por separado (extensión, scripts de usuario, aplicación de escritorio, Discord, presencia y actividad), para que sepas cuál debes solucionar.
- **Interfaz en un panel lateral e idiomas.** La extensión vive en el panel lateral del navegador, y tanto la interfaz como el sitio web están disponibles en 11 idiomas.
- **Aplicación de escritorio para Windows, macOS y Linux**, con un paquete `.deb` y un archivo comprimido para otras distribuciones.
- **Sincronización opcional de la cuenta.** Inicia sesión con Discord solo si quieres tener tus presencias y ajustes en varios navegadores.

## Licencias

El código de PreMiD es de código abierto. Las presencias de Nowly son de código abierto bajo la licencia MIT, y su SDK y CLI están documentados para colaboradores. El código principal de Nowly es público en GitHub bajo la Business Source License 1.1, una licencia de código disponible: puedes leerlo y auditarlo, pero no es una licencia de código abierto aprobada por la OSI. Si esa diferencia te importa, conviene que la conozcas.

## ¿Cuál deberías elegir?

- **Tu plataforma solo está en PreMiD:** utiliza PreMiD.
- **Tus plataformas están en ambos:** prueba Nowly si te importan las presencias firmadas, la privacidad por defecto y el control detallado; quédate en PreMiD si estás satisfecho.
- **Quieres usar ambos para distintas plataformas:** es posible, pero ten cuidado. Dos herramientas que actualizan tu actividad de Discord a la vez pueden sustituir o borrar el estado de la otra. Asegúrate de que cada plataforma esté a cargo de una sola de ellas y desactiva la otra herramienta mientras haces pruebas.

## Pasar de PreMiD a Nowly

1. Cierra la aplicación de escritorio de PreMiD y desactiva su extensión del navegador para que deje de actualizar tu actividad.
2. Sigue [Cómo configurar Nowly](/guides/set-up-nowly): extensión, scripts de usuario, aplicación de escritorio y Discord.
3. Instala desde la [biblioteca](/library) las presencias que sustituyen a las que utilizabas.
4. Comprueba el diagnóstico en el panel lateral y después tu perfil de Discord.

Si falta en la biblioteca alguna plataforma que utilizabas con PreMiD, solicítala desde la [página de asistencia](/support): se añaden presencias nuevas con frecuencia y cualquiera puede escribir una con la [guía para desarrolladores](/guides/create-your-first-presence).
