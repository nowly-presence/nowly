---
title: "Nowly sous Linux : .deb, archive, Flatpak et Snap"
description: Installer l'application de bureau Nowly sur n'importe quelle distribution, sortir de la boucle « mise à jour disponible » et faire marcher la Rich Presence avec un Discord ou un navigateur installé via Flatpak ou Snap.
category: troubleshooting
order: 3
updated: 2026-10-07
related: rich-presence-not-showing, set-up-nowly, what-is-discord-rich-presence
---

Nowly fonctionne sous Linux comme sous Windows et macOS : l'extension du navigateur détecte votre activité, et l'application de bureau la transmet à l'application Discord du même ordinateur. Linux ajoute toutefois quelques choix, et les paquets isolés peuvent gêner. Ce guide couvre l'installation sur tous les types de distribution et les corrections des problèmes que rencontrent vraiment les utilisateurs Linux.

## Prérequis

- Une distribution 64 bits (x64) avec glibc 2.17 ou plus récente, ce qui couvre toutes les distributions courantes actuelles.
- L'application Discord, depuis le `.deb` de Discord, l'archive officielle, votre distribution, Flatpak ou Snap.
- Chrome, Chromium, Brave, Edge, Opera ou Firefox, de préférence installé depuis les dépôts de votre distribution ou le paquet de l'éditeur.

## Choisir le bon téléchargement

La [page de l'application de bureau](/desktop) propose deux fichiers pour Linux :

- **Le paquet `.deb`** pour Debian, Ubuntu, Linux Mint, Pop!_OS, elementary OS et les autres systèmes basés sur Debian. Il installe l'application pour tout le système et la déclare auprès des navigateurs pris en charge.
- **L'archive `.tar.gz`** pour tout le reste : Fedora, Arch, openSUSE, etc. Elle contient l'application et un script d'installation qui la déclare pour votre utilisateur.

## Installer le paquet .deb

Sur la plupart des bureaux, un double-clic sur le fichier ouvre un installateur de logiciels. Sur certains, XFCE avec Thunar par exemple, le double-clic ne fait rien si aucun installateur graphique n'est configuré. Installez-le alors depuis un terminal :

```bash
sudo dpkg -i ~/Téléchargements/nowly-host.deb
```

Adaptez le chemin si votre dossier de téléchargement s'appelle `Downloads`. Vérifiez ensuite que le paquet est bien installé :

```bash
dpkg -L nowly-host
```

La liste doit contenir `/usr/lib/nowly-client/nowly-host`. Redémarrez complètement votre navigateur, pas seulement l'onglet, pour qu'il trouve la nouvelle application.

## Installer depuis l'archive

Décompressez l'archive, ouvrez un terminal dans le dossier obtenu et lancez le script d'installation qu'il contient, en suivant les instructions qu'il affiche. Il copie l'application dans votre dossier personnel et écrit les petits fichiers manifestes qui indiquent aux navigateurs où la trouver, par exemple `~/.config/google-chrome/NativeMessagingHosts/nowly.client.json` pour Chrome ou `~/.mozilla/native-messaging-hosts/nowly.client.json` pour Firefox. Redémarrez ensuite le navigateur.

## « Mise à jour disponible » juste après l'installation

Si le panneau de Nowly indique qu'une mise à jour de l'application de bureau est disponible alors que vous venez d'installer la dernière version, vérifiez ces deux causes dans l'ordre :

1. **Le `.deb` n'a jamais été installé.** Lancez `dpkg -L nowly-host`. S'il indique que le paquet n'est pas installé, installez-le depuis un terminal comme ci-dessus.
2. **Une ancienne installation par utilisateur passe en priorité.** Si vous avez utilisé l'archive avant de passer au `.deb`, l'ancien manifeste de votre dossier personnel pointe encore vers l'ancienne application. Supprimez-le :

```bash
rm -f ~/.mozilla/native-messaging-hosts/nowly.client.json
rm -f ~/.config/*/NativeMessagingHosts/nowly.client.json
rm -f ~/.local/share/NowlyClient/nowly-host
```

Quittez ensuite complètement le navigateur et rouvrez-le, pour qu'il lance l'application de bureau depuis son nouvel emplacement.

## Discord installé via Flatpak ou Snap

Les versions isolées de Discord créent leur socket de Rich Presence dans leur propre dossier au lieu de l'emplacement habituel. L'application de bureau Nowly cherche `discord-ipc-0` à `discord-ipc-9` dans `$XDG_RUNTIME_DIR`, `$TMPDIR` et `/tmp` : elle peut donc manquer un Discord Flatpak ou Snap. Les autres outils de Rich Presence ont le même problème, et la solution habituelle est un lien symbolique de l'emplacement attendu vers le vrai socket.

Pour **Discord depuis Flathub**, le socket se trouve dans `$XDG_RUNTIME_DIR/app/com.discordapp.Discord/`. Créez le lien avec :

```bash
ln -sf "$XDG_RUNTIME_DIR/app/com.discordapp.Discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

`$XDG_RUNTIME_DIR` est vidé à chaque redémarrage, le lien disparaît donc aussi. Pour le recréer automatiquement à chaque connexion, confiez-le à systemd :

```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

Pour **Discord depuis le Snap Store**, le socket se trouve en général dans `$XDG_RUNTIME_DIR/snap.discord/`. Le même type de lien fonctionne :

```bash
ln -sf "$XDG_RUNTIME_DIR/snap.discord/discord-ipc-0" "$XDG_RUNTIME_DIR/discord-ipc-0"
```

Lancez Discord avant de créer le lien, puis cliquez sur **Vérifier la connexion** dans le panneau latéral de Nowly.

## Navigateur installé via Flatpak ou Snap

Le navigateur lance l'application de bureau Nowly par le native messaging. Les navigateurs isolés limitent les programmes qu'ils peuvent lancer, et selon le paquet et sa version, le native messaging peut être complètement bloqué. Le symptôme : une ligne **Nowly Desktop détecté** qui ne passe jamais au vert, quoi que vous installiez.

La solution fiable est d'utiliser un navigateur installé depuis les dépôts de votre distribution ou depuis le paquet `.deb` ou `.rpm` de l'éditeur, plutôt que sa version Flatpak ou Snap. Vos favoris et mots de passe reviennent en vous connectant à votre compte de navigateur.

## Notifications et journaux

Quand Discord bloque la connexion pour un problème de permissions, l'application de bureau peut afficher une notification via `notify-send`, si votre bureau dispose d'un service de notifications.

L'application de bureau écrit son journal dans `~/.cache/NowlyClient/nowly-host.log`. Il peut contenir l'activité envoyée à Discord : relisez-le avant de le partager dans un ticket. Vous pouvez le supprimer à tout moment.

## Récapitulatif

- `dpkg -L nowly-host` liste l'application, ou le script d'installation de l'archive s'est terminé sans erreur.
- Aucun manifeste ne reste d'une ancienne installation.
- Discord est lancé, et son socket est accessible depuis `$XDG_RUNTIME_DIR` ou `/tmp`.
- Le navigateur ne vient pas de Flatpak ou Snap, ou le native messaging y fonctionne.

Si ces quatre points sont vrais et que Nowly ne joint toujours pas Discord, suivez la [liste de dépannage](/guides/rich-presence-not-showing) et ouvrez un ticket sur le serveur Discord de Nowly en précisant votre distribution, votre bureau et la façon dont Discord et le navigateur ont été installés.
