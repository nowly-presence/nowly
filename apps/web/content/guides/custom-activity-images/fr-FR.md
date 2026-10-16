---
title: Choisir les images d'une activité personnalisée
description: Envoyer une image, utiliser un lien HTTPS ou une icône, comprendre les copies locales, l'expiration et les erreurs d'images dans Nowly 2.4.0.
category: troubleshooting
order: 5
updated: 2026-10-16
related: create-custom-discord-activity, share-custom-activities, rich-presence-not-showing
---

Chaque activité personnalisée dispose d'une **Grande image** et d'une **Petite image**, qui apparaît comme un badge sur la première. Ouvrez l'activité dans **Perso**, puis la section **Images**. Pour le reste de l'éditeur, consultez [Créer une activité Discord](/guides/create-custom-discord-activity).

> La capture montre l'aperçu de développement de Nowly en anglais, avec des données simulées. Elle illustre les réglages d'images, pas un envoi réel ou une connexion Discord réelle.

## Choisir la bonne source

| Option | Quand l'utiliser | À savoir |
| --- | --- | --- |
| Icône | Pour une image simple sans fichier à préparer | 24 icônes et 10 couleurs, générées pour Discord par Nowly. |
| Envoyer | Pour votre propre illustration | Une copie est conservée sur l'appareil et une version est envoyée au service d'images de Nowly. |
| Lien | Pour une image déjà accessible en ligne | Utilisez une URL HTTPS directe vers l'image, pas une page de partage ou un fichier privé. |
| Aucune | Pour ne pas choisir d'image | En grande image, Discord utilise le logo Nowly ; en petite image, aucun badge n'est affiché. |

Une nouvelle activité peut déjà proposer une icône colorée. Choisissez **Aucune** explicitement si vous préférez le comportement sans image personnalisée.

![Réglages d'images avec les options Upload, Link, Icon et None, une palette de couleurs et 24 icônes](https://images.nowly.me/guides-screenshots/custom-activities/04-image-options.png "Choisissez la source de la grande image et de l'éventuel petit badge.")

## Envoyer votre propre fichier

1. Dans **Grande image** ou **Petite image**, choisissez **Envoyer**.
2. Utilisez **Choisir une image** et sélectionnez un fichier PNG, JPEG, WebP ou GIF.
3. Attendez la fin de l'envoi avant d'enregistrer l'activité.
4. Ajoutez éventuellement un **Texte au survol**, puis choisissez **Enregistrer**.

Les images hors GIF sont redimensionnées automatiquement, avec une première cible de **1024 pixels** puis des réductions si nécessaire, et converties en WebP. La limite après préparation est de **1 Mio par image**. Les GIF ne sont ni redimensionnés ni convertis automatiquement : préparez-les sous la limite avant l'envoi.

Le serveur autorise **20 envois par heure et par appareil**. Importer des activités contenant des images embarquées utilise aussi le service d'envoi. Si vous avez beaucoup essayé ou remplacé des images, attendez avant de recommencer.

## Utiliser une image déjà en ligne

Choisissez **Lien** et collez une adresse qui commence par `https://`. Vérifiez que l'image est publique, accessible sans connexion et autorisée à être partagée. Un lien de page contenant une image n'est pas forcément une URL d'image.

N'utilisez pas d'URL avec un jeton privé, un lien temporaire sensible ou un document personnel. Cette adresse est destinée à être utilisée par Discord et reste dans un éventuel fichier d'export de l'activité.

## Comprendre la copie locale et l'hébergement

- Le panneau Nowly affiche la copie locale de vos fichiers envoyés, pour ne pas dépendre de leur téléchargement à chaque aperçu.
- Discord reçoit une URL hébergée. Une image visible dans l'éditeur peut donc ne pas encore être visible dans Discord si l'hébergement ou sa récupération échoue.
- L'extension rafraîchit les images de l'activité active à l'activation puis périodiquement.
- Les images hébergées inutilisées depuis **30 jours** peuvent être supprimées par le nettoyage du service. Quand nécessaire, Nowly les renvoie depuis la copie locale.
- La copie locale reste importante : une désinstallation de l'extension ou un effacement de ses données peut la supprimer. [Exportez vos activités](/guides/share-custom-activities) pour les conserver ailleurs.

L'export d'activité embarque les images envoyées seulement si leurs copies locales existent. L'import les envoie à nouveau pour le nouvel appareil. Les liens d'images restent des liens : ils ne sont pas transformés en sauvegardes de leurs fichiers.

## Résoudre une erreur d'image

| Problème | Vérification |
| --- | --- |
| Cette image est trop lourde, même redimensionnée. | Réduisez les dimensions ou la qualité avec un outil local. Pour un GIF, réduisez aussi les images de l'animation ou choisissez une image fixe. |
| Utilisez une image PNG, JPEG, WebP ou GIF. | Choisissez un format pris en charge. Renommer simplement l'extension d'un fichier ne convertit pas son contenu. |
| Ce fichier n'est pas une image valide. | Ouvrez le fichier localement puis exportez-le à nouveau depuis votre outil d'image. Nowly vérifie aussi la signature réelle du fichier. |
| L'image n'a pas pu être envoyée. Réessayez ou utilisez un lien. | Vérifiez le réseau, attendez si la limite d'envoi est atteinte, puis réessayez. Une indisponibilité du service d'images peut aussi empêcher l'envoi. |
| Une image n'a pas pu être importée, elle a été laissée vide. | L'activité est importée sans cette image. Remplacez-la dans l'éditeur après avoir vérifié le réseau et la limite d'envoi. |
| L'aperçu est correct mais pas Discord. | Vérifiez la connexion de Nowly Desktop, l'activation de l'activité et l'accès public à l'image. Un cache de Discord peut retarder une modification ; évitez les envois répétés en boucle. |

Si aucune partie de l'activité n'apparaît sur Discord, commencez plutôt par [Le Rich Presence ne s'affiche pas](/guides/rich-presence-not-showing).

## Avant de publier une image

Utilisez uniquement des images que vous avez le droit de partager et que vous acceptez de montrer aux personnes qui voient votre activité. Une copie locale ne signifie pas que l'image reste uniquement sur votre appareil : **Envoyer** utilise un hébergement distant et Discord peut mettre l'image en cache. Les activités personnalisées ne sont pas synchronisées avec votre compte, mais leurs fichiers de partage peuvent contenir les images.
