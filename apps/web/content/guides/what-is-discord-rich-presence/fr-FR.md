---
title: "Qu'est-ce que la Rich Presence Discord ? Fonctionnement et contenu"
description: La carte sous votre pseudo Discord expliquée, des types d'activité et des champs jusqu'à la connexion locale que les programmes utilisent pour la mettre à jour, et pourquoi les sites ont besoin d'un intermédiaire.
category: discord
order: 1
updated: 2026-10-07
related: discord-connections-vs-nowly, set-up-nowly, what-nowly-can-see
---

Si vous avez déjà vu le profil Discord d'un ami indiquer **Joue à** un jeu, avec une image, un chronomètre et un bouton **Rejoindre**, vous avez vu une Rich Presence. C'est la fonction qui permet à un programme de décrire en détail ce que vous faites, au lieu d'un simple nom. Ce guide explique ce que contient une Rich Presence, comment les programmes l'envoient à Discord, et pourquoi afficher un site web demande un outil comme Nowly.

## D'un nom de jeu à une activité riche

Au départ, Discord détectait le jeu lancé et écrivait son nom sous le vôtre. La Rich Presence, créée pour les développeurs de jeux, va plus loin : le programme lui-même indique à Discord ce qui se passe, par exemple la carte, le score ou le nombre de joueurs dans votre groupe, et le met à jour au fil de la partie.

Le même mécanisme marche pour tout, pas seulement les jeux. Des lecteurs de musique, des éditeurs de code et des outils de streaming l'utilisent, et Nowly l'utilise pour les sites web.

## Ce que contient une carte Rich Presence

Une Rich Presence est un petit ensemble de champs. Tous les programmes ne les remplissent pas tous.

| Champ | Ce qu'il affiche | Exemple avec YouTube |
| --- | --- | --- |
| Type d'activité | Le verbe devant le nom | Regarde |
| Nom | L'application | YouTube |
| Détails | La première ligne | Le titre de la vidéo |
| État | La deuxième ligne | Le nom de la chaîne |
| Grande image | L'image principale, avec une infobulle | La miniature de la vidéo |
| Petite image | Un badge dans le coin de l'image | Une icône lecture ou pause |
| Horodatage | Le temps écoulé, ou une barre de progression avec début et fin | 14:10 sur 26:48 |
| Boutons | Jusqu'à deux liens que les autres peuvent ouvrir | Voir la vidéo |

Le type d'activité est **Joue à**, **Écoute**, **Regarde** ou **Participe à**. C'est pourquoi une présence musicale affiche **Écoute Spotify** et une présence vidéo **Regarde Netflix**.

## Comment les programmes parlent à Discord

La Rich Presence ne passe pas d'abord par Internet. Au démarrage, l'application Discord pour ordinateur ouvre un canal local sur votre machine : un canal nommé `discord-ipc-0` sous Windows, et un fichier socket du même nom sous macOS et Linux. Un programme qui veut définir votre activité :

1. se connecte à ce canal,
2. se présente avec un identifiant d'application enregistré auprès de Discord, qui donne à l'activité son nom et ses images,
3. envoie les champs de l'activité,
4. envoie des mises à jour quand quelque chose change, ou efface l'activité quand vous arrêtez.

L'application Discord publie ensuite l'activité sur votre profil via les serveurs de Discord, pour que vos amis la voient sur tous leurs appareils.

Comme le canal est local, seuls les programmes qui tournent sur le même ordinateur que l'application Discord peuvent l'utiliser. Discord dans un onglet ou sur un téléphone ne l'ouvre pas.

## Pourquoi les sites ont besoin d'un intermédiaire

Un site web ne peut pas ouvrir ce canal local. Les navigateurs tiennent volontairement les pages web à l'écart de votre système, et les extensions sont elles aussi isolées. Même si le navigateur sait quelle vidéo vous regardez, il n'a aucun moyen de le dire directement à Discord.

C'est ce manque que Nowly comble :

- une **présence** lit la page dans votre navigateur et prépare l'activité,
- l'**extension** la récupère et applique vos réglages,
- l'**application de bureau** est le programme de votre ordinateur qui ouvre le canal local de Discord et envoie l'activité.

L'application de bureau est légère, n'a pas de fenêtre et est lancée par le navigateur quand il en a besoin. Sans elle, une extension seule ne peut pas mettre à jour la Rich Presence.

## Qui peut voir votre Rich Presence

Votre activité s'affiche sur votre profil et dans les listes de membres pour les personnes qui voient votre statut : vos amis, et les membres des serveurs que vous partagez, sauf si vous coupez le partage d'activité dans les réglages **Confidentialité des activités** de Discord ou pour un serveur précis. En statut **Invisible**, personne ne la voit.

Les boutons sont destinés aux autres : ils permettent à vos amis d'ouvrir la même vidéo ou le même épisode.

## Les limites à connaître

- **Une activité par application à la fois.** Quand plusieurs programmes modifient votre activité, Discord peut en afficher une, plusieurs, ou passer de l'une à l'autre. Évitez de lancer deux outils qui affichent la même chose.
- **Les mises à jour sont limitées.** Discord accepte un nombre limité de mises à jour sur une courte période, un statut peut donc avoir quelques secondes de retard sur la page. L'horodatage permet à Discord de compter le temps lui-même au lieu de recevoir des mises à jour en continu.
- **Les images doivent être accessibles à Discord.** Les images sont téléchargées par Discord, pas par votre ordinateur : les images privées ou protégées ont besoin d'un proxy. Voir [Ce que Nowly peut voir](/guides/what-nowly-can-see) pour la façon dont Nowly s'en occupe.

## La Rich Presence et les connexions intégrées de Discord

Discord affiche aussi certaines activités sans aucun programme supplémentaire, quand vous liez un compte dans **Connexions**, comme Spotify. Ces intégrations fonctionnent autrement et ont leurs propres avantages et limites. La comparaison est dans [Connexions Discord ou Nowly](/guides/discord-connections-vs-nowly).
