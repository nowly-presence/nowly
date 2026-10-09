---
title: Ce que Nowly peut voir, et où vont vos données
description: Le chemin de votre activité d'une page web jusqu'à Discord, ce qu'une présence lit, ce qui reste sur votre ordinateur, et les quelques options qui parlent aux serveurs de Nowly.
category: privacy
order: 2
updated: 2026-10-07
related: control-what-discord-shows, allow-user-scripts, what-is-discord-rich-presence
---

Un outil qui sait ce que vous regardez doit répondre clairement à une question simple : où va cette information ? Ce guide suit votre activité étape par étape, liste ce qui reste sur votre appareil, et dit franchement quelles fonctions optionnelles parlent aux serveurs de Nowly. Il accompagne la [politique de confidentialité](/privacy), qui reste la référence.

## La version courte

Votre activité va de la page web à l'application Discord de votre propre ordinateur, et nulle part ailleurs. Elle ne passe jamais par nowly.me ni par l'API de Nowly. Les statistiques d'utilisation sont désactivées tant que vous ne les activez pas, et le compte est facultatif.

## Le chemin de votre activité

Voici ce qui se passe quand vous lancez la lecture sur un site pris en charge :

1. **La présence lit la page.** La présence de ce site tourne dans votre onglet et lit ce dont elle a besoin : un titre, un numéro d'épisode, un nom de chaîne, l'état lecture ou pause.
2. **L'extension prépare l'activité.** Elle applique vos réglages (pause, horaires, modes privés, langue) et construit la Rich Presence.
3. **L'application de bureau la reçoit.** L'extension l'envoie à l'application de bureau Nowly par le native messaging, un canal entre le navigateur et un programme du même ordinateur.
4. **Discord la reçoit en local.** L'application de bureau la transmet à l'application Discord par la connexion locale de Discord.
5. **Discord la partage.** À partir de là, l'application Discord l'envoie à ses serveurs pour que vos amis la voient, selon la politique de confidentialité de Discord.

Les étapes 1 à 4 se passent toutes sur votre ordinateur. Les serveurs de Nowly ne font pas partie de ce chemin.

## Ce qu'une présence lit

Une présence ne lit que la page pour laquelle elle a été écrite, et seulement ce qu'il faut pour votre statut. La présence YouTube lit le titre de la vidéo, la chaîne, l'adresse de la miniature et la position de lecture. La présence Spotify lit le morceau que votre navigateur joue. Une présence ne lit ni vos autres onglets, ni votre historique, ni les champs de formulaire, ni vos mots de passe.

Certains sites n'exposent leurs détails que par leurs propres données. La présence Netflix, par exemple, demande au site de Netflix le titre et l'épisode en cours, depuis l'onglet Netflix, exactement comme le fait la page Netflix elle-même.

## Les images et le proxy d'images

Discord doit télécharger les images affichées dans votre statut. La plupart sont publiques et Discord les charge directement. Certaines, comme les affiches de Netflix, ne peuvent pas être chargées telles quelles par Discord. Pour celles-là, la présence utilise le proxy d'images de Nowly : l'adresse de l'image passe par l'API de Nowly, qui la récupère pour que Discord puisse l'afficher.

Cette adresse peut correspondre au titre que vous regardez, c'est donc bon à savoir. Le proxy ne sert qu'à cela, jamais à construire des profils publicitaires, et ses journaux ne sont conservés que le temps nécessaire au fonctionnement et à la sécurité du service.

## Ce qui reste sur votre ordinateur

- Vos présences installées, leurs réglages et leur état activé ou non.
- Votre activité en cours : titre, plateforme, durée et adresse de l'image.
- Un journal de débogage avec les actions récentes et les adresses des pages compatibles visitées, utile quand quelque chose casse.
- Le journal de l'application de bureau, `nowly-host.log`, dans son dossier de cache.
- Une copie locale de votre nom et de votre avatar Discord, prise dans l'application Discord pour les afficher dans l'extension.

Tout cela est effacé quand vous réinitialisez ou désinstallez l'extension, et vous pouvez supprimer le journal de l'application de bureau à tout moment.

## Les autorisations, en clair

- **Accès aux sites web** : un script léger vérifie si la page ouverte appartient à une plateforme prise en charge, pour que le panneau latéral propose la bonne présence. Il n'envoie votre historique nulle part.
- **Scripts utilisateur** : permet aux présences installées de tourner sur leurs propres sites. Voir [Pourquoi Nowly vous demande d'autoriser les scripts utilisateur](/guides/allow-user-scripts).
- **Native messaging** : permet à l'extension de parler à l'application de bureau de votre ordinateur.
- **Stockage** : conserve vos réglages et vos présences dans le navigateur.

## Ce qui peut arriver chez Nowly, et seulement si vous le choisissez

- **Les statistiques d'utilisation** sont désactivées par défaut. Si vous les activez, l'API de Nowly reçoit un identifiant d'appareil aléatoire, votre navigateur, votre système, votre langue et les versions, ainsi que des événements comme les installations. Jamais vos pages, titres, recherches ni votre identité Discord.
- **Un compte** est facultatif. Si vous vous connectez avec Discord, vos réglages et la liste de vos présences sont synchronisés entre vos navigateurs. Votre activité en cours, vos onglets et votre historique ne le sont jamais.
- **Les « j'aime » et les signalements** envoyés depuis une page de présence arrivent à l'API de Nowly, avec ce que vous avez écrit pour un signalement.
- **Le téléchargement des présences** depuis la bibliothèque contacte les serveurs et le CDN de Nowly, comme tout téléchargement.

## Vos données, sous votre contrôle

- La page [Vos données](/consent) permet d'activer ou couper les statistiques, et d'exporter ou supprimer tout ce qui est stocké pour votre appareil.
- La [page du compte](/account) permet de télécharger les données de votre compte ou de le supprimer.
- Désinstaller l'extension efface tout ce qu'elle avait stocké en local.

## Ce que Discord en fait

Une fois votre activité arrivée chez Discord, Discord l'affiche aux personnes autorisées à voir votre profil et la traite selon sa propre politique de confidentialité. Nowly ne peut rien y changer, mais vous pouvez choisir ce qui est envoyé au départ : voir [Choisir exactement ce que Discord affiche de vous](/guides/control-what-discord-shows).
