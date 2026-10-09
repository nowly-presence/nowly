---
title: "Nowly en Linux: .deb, archivo comprimido, Flatpak y Snap"
description: Instala la aplicación de escritorio de Nowly en cualquier distribución, soluciona el aviso recurrente de actualización disponible y haz funcionar Rich Presence con Discord o un navegador instalado mediante Flatpak o Snap.
category: troubleshooting
order: 3
updated: 2026-10-09
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly funciona en Linux igual que en Windows y macOS: la extensión del navegador detecta tu actividad y la aplicación de escritorio se la envía a la aplicación de Discord en el mismo ordenador. En Linux hay más opciones, aunque los paquetes aislados pueden interponerse. Esta guía explica cómo instalarlo en cualquier tipo de distribución y cómo resolver los problemas que se encuentran los usuarios de Linux.

## Requisitos

- Una distribución de 64 bits (x64) con glibc 2.17 o posterior, lo que incluye todas las distribuciones convencionales actuales.
- La aplicación de escritorio de Discord, procedente del `.deb` de Discord, el archivo comprimido oficial, tu distribución, Flatpak o Snap.
- Chrome, Chromium, Brave, Edge, Opera o Firefox, preferiblemente instalado desde los repositorios de tu distribución o el paquete del proveedor.

## Elige la descarga adecuada

La [página de la aplicación de escritorio](/desktop) ofrece dos archivos para Linux:

- **El paquete `.deb`** para Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS y otros sistemas basados en Debian. Instala la aplicación para todo el sistema y la registra en todos los navegadores compatibles.
- **El archivo `.tar.gz`** para las demás distribuciones: Fedora, Arch, openSUSE y otras. Contiene la aplicación y un script que la registra para tu usuario.

## Instala el paquete .deb

En la mayoría de los escritorios, un doble clic en el archivo abre un instalador de software. En algunos, como XFCE con Thunar, el doble clic no hace nada si no hay instalado un gestor gráfico de paquetes. Instálalo desde una terminal:

```bash
sudo dpkg -i ~/Downloads/nowly-host.deb
```

Después, comprueba que se haya instalado de verdad:

```bash
dpkg -L nowly-host
```

La lista debería incluir `/usr/lib/nowly-client/nowly-host`. Reinicia por completo el navegador, no solo la pestaña, para que encuentre la aplicación nueva.

## Instala desde el archivo comprimido

Extrae el archivo, abre una terminal en la carpeta extraída y ejecuta el script de instalación que contiene siguiendo las instrucciones que muestre. Copia la aplicación en tu carpeta personal y escribe los pequeños archivos de configuración que indican a los navegadores dónde encontrarla, como `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` para Chrome o `~/.mozilla/native-messaging-hosts/nowly.client.json` para Firefox. Después, reinicia el navegador.

## «Actualización disponible» justo después de instalar

Si el panel lateral de Nowly indica que hay una actualización de la aplicación de escritorio aunque acabas de instalar la última versión, comprueba estas dos causas por orden:

1. **El `.deb` nunca se instaló.** Ejecuta `dpkg -L nowly-host`. Si indica que el paquete no está instalado, instálalo desde una terminal como se explica más arriba.
2. **Una instalación antigua del usuario tiene prioridad.** Si antes utilizaste el archivo comprimido y luego cambiaste al `.deb`, el archivo de configuración antiguo de tu carpeta personal sigue apuntando a la aplicación anterior. Elimínalo:

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Después, cierra por completo el navegador y vuelve a abrirlo para que inicie la aplicación de escritorio desde la ubicación nueva.

## Discord instalado mediante Flatpak o Snap

Las versiones aisladas de Discord crean su socket de Rich Presence dentro de su carpeta aislada en vez de hacerlo en la ubicación habitual. La aplicación de escritorio de Nowly busca de `discord-ipc-0` a `discord-ipc-9` en `$XDG_RUNTIME_DIR`, `$TMPDIR` y `/tmp`, por lo que puede no encontrar Discord instalado mediante Flatpak o Snap. Otras herramientas de Rich Presence tienen el mismo problema. La solución habitual es crear un enlace simbólico desde la ubicación esperada hasta el socket real.

Para **Discord de Flathub**, el socket está en `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Crea el enlace así:

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` se vacía cada vez que reinicias, así que el enlace también desaparece. Para recrearlo automáticamente al iniciar sesión, deja que systemd se encargue:

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Para **Discord de la tienda de Snap**, el socket suele estar en `$XDG_RUNTIME_DIR/snap.discord/`. Funciona un enlace similar:

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Inicia Discord antes de crear el enlace y después haz clic en **Comprobar conexión** en el panel lateral de Nowly.

## Navegador instalado mediante Flatpak o Snap

El navegador inicia la aplicación de escritorio de Nowly mediante mensajería nativa. Los navegadores aislados restringen los programas que pueden iniciar y, según el paquete y su versión, la mensajería nativa puede estar totalmente bloqueada. El síntoma es una fila **Nowly Desktop detectado** que nunca se pone verde, instales lo que instales.

La solución fiable es utilizar un navegador instalado desde los repositorios de tu distribución o desde el paquete `.deb` o `.rpm` del proveedor, en vez de su versión Flatpak o Snap. Tus marcadores y contraseñas volverán cuando inicies sesión en tu cuenta del navegador.

## Notificaciones y registros

Si Discord bloquea la conexión debido a un problema de permisos, la aplicación de escritorio puede mostrar una notificación mediante `notify-send`, siempre que tu entorno de escritorio tenga un servicio de notificaciones.

La aplicación de escritorio guarda su registro en `~/.cache/NowlyClient/nowly-host.log`. Puede contener la actividad enviada a Discord, así que léelo antes de compartirlo en un ticket de asistencia. Puedes borrarlo cuando quieras.

## Lista de comprobación

- `dpkg -L nowly-host` enumera la aplicación, o el script de instalación del archivo comprimido se ejecutó sin errores.
- No queda ningún archivo de configuración de una instalación antigua.
- Discord está abierto y se puede acceder a su socket desde `$XDG_RUNTIME_DIR` o `/tmp`.
- El navegador no procede de Flatpak ni de Snap, o la mensajería nativa funciona en él.

Si se cumplen los cuatro puntos y Nowly sigue sin conectar con Discord, sigue la [lista de comprobaciones para solucionar problemas](/guides/rich-presence-not-showing) y abre un ticket en el servidor de Discord de Nowly. Indica tu distribución, tu entorno de escritorio y cómo instalaste Discord y el navegador.
