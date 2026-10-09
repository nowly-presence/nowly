---
title: Afficher ce que vous regardez sur Discord (Netflix, Prime Video, Disney+ et plus)
description: Comment afficher la série ou le film en cours comme statut Discord, ce que montre chaque présence de streaming, et pourquoi cela marche là où le partage d'écran donne un écran noir.
category: start
order: 3
updated: 2026-10-07
related: set-up-nowly, control-what-discord-shows, rich-presence-not-showing
---

Discord affiche d'office le jeu auquel vous jouez, mais pas la série que vous regardez dans votre navigateur. Avec Nowly, votre profil peut indiquer **Regarde Netflix** avec le titre, l'épisode, l'affiche et votre avancement, et vos amis peuvent ouvrir le même épisode en un clic. Ce guide explique comment le mettre en place pour les services de streaming et ce qu'il faut attendre de chacun.

## Ce qu'il vous faut

Si Nowly n'est pas encore installé, suivez d'abord [Installer Nowly](/guides/set-up-nowly) : l'extension, les scripts utilisateur, l'application de bureau et l'application Discord. Installez ensuite une présence pour chaque service que vous utilisez depuis la [bibliothèque](/library). Parmi les présences de streaming : Netflix, Prime Video, Disney+, Crunchyroll, HBO Max, Paramount+, Peacock, Apple TV+, Canal+ et ADN.

## Ce que verront vos amis

Une présence de streaming remplit la carte Rich Presence avec ce qui est à l'écran. Avec Netflix, par exemple :

- **Regarde Netflix** en haut.
- Le titre de la série ou du film sur la première ligne.
- Pour une série, la saison et l'épisode, écrits `S1.E3`, suivis du titre de l'épisode. Pour un film, son année.
- L'affiche comme image principale, avec un badge lecture ou pause.
- Pendant la lecture, le temps écoulé et le temps restant.
- Un bouton, **Voir l'épisode** ou **Voir le film**, qui ouvre le même titre pour vos amis.

Prime Video et Disney+ fonctionnent de la même façon, avec la saison et l'épisode quand le lecteur les affiche. Crunchyroll affiche la série, le titre de l'épisode et une image, et ajoute un bouton vers la page de la série.

## Regarder, pas parcourir

Par défaut, les présences de streaming se concentrent sur le lecteur, pour que votre statut ne change pas à chaque hésitation entre deux séries. Le détail varie un peu :

- **Netflix** n'affiche rien tant qu'aucun titre ne joue : l'accueil, la recherche et les fiches restent privés.
- **Prime Video** et **Disney+** affichent aussi la fiche du titre ouverte, avec **Consulte une fiche** ou **Consulte une série** et son nom. L'accueil, la recherche et les listes restent privés.
- **Crunchyroll** affiche aussi ses pages principales, comme la page d'une série, le calendrier simulcast, votre watchlist ou une recherche. Activez son **Mode privé** pour masquer les titres.

Pour en montrer plus, activez **Afficher l'activité de navigation** dans les réglages de la présence, dans le panneau latéral. Votre statut vous suit alors sur l'accueil, dans les listes et dans la recherche, où il peut afficher ce que vous avez tapé.

## Pourquoi ça marche quand le partage d'écran ne marche pas

Si vous avez déjà partagé votre écran sur Discord en regardant Netflix, vous avez sans doute vu un rectangle noir à la place de la vidéo. Les services de streaming protègent leurs vidéos par des DRM, et les navigateurs excluent les vidéos protégées des captures d'écran.

La Rich Presence, c'est autre chose : elle n'envoie jamais la vidéo, seulement du texte et une affiche qui la décrivent. C'est pour cela qu'elle marche avec tous les services, et qu'elle ne contourne aucune règle des plateformes. Pour regarder ensemble, utilisez la fonction de visionnage en groupe de la plateforme quand elle existe, et laissez votre statut Discord dire à vos amis ce qui passe.

## Garder certaines choses pour vous

Toutes les soirées n'ont pas besoin de public. Quelques options rapides :

- **Tout mettre en pause** avec **Ctrl+Maj+U** (**Cmd+Maj+U** sur Mac), et le même raccourci pour reprendre.
- **Masquer cet onglet** dans le panneau latéral pour garder un onglet privé pendant que les autres restent partagés.
- **Mettre en veille** une présence pour une heure, quatre heures ou jusqu'à demain.
- **Ne partager qu'à certaines heures** avec des horaires, pour toutes les présences ou seulement celles de streaming.
- Sur **Crunchyroll**, activez le **Mode privé** pour masquer le titre tout en montrant que vous regardez quelque chose.

Tous les détails sont dans [Choisir exactement ce que Discord affiche de vous](/guides/control-what-discord-shows).

## Si votre statut reste vide

- Vérifiez que le titre est bien lu dans le navigateur, pas dans une application TV ou sur votre téléphone.
- Vérifiez que vous êtes sur l'adresse prise en charge par la présence : Prime Video fonctionne sur `primevideo.com`, Netflix sur `netflix.com`.
- Rechargez l'onglet une fois après avoir installé une présence.

Pour tout le reste, la [liste de dépannage](/guides/rich-presence-not-showing) passe en revue chaque maillon de la chaîne.
