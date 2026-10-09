---
title: Pourquoi Nowly vous demande d'autoriser les scripts utilisateur, et comment le faire
description: Ce qu'est l'autorisation des scripts utilisateur, pourquoi les présences en ont besoin, comment l'activer dans Chrome, Edge, Brave, Opera et Firefox, et ce qu'elle ne permet pas.
category: start
order: 2
updated: 2026-10-07
related: set-up-nowly, what-nowly-can-see, rich-presence-not-showing
---

Pendant l'installation, Nowly demande une autorisation que la plupart des extensions ne demandent jamais : le droit d'exécuter des scripts utilisateur. Le terme est technique, et l'avertissement du navigateur peut inquiéter. Ce guide explique ce que couvre vraiment cette autorisation, pourquoi Nowly repose dessus, et comment l'activer dans chaque navigateur pris en charge.

## Qu'est-ce qu'un script utilisateur

Un script utilisateur est un petit morceau de JavaScript qui s'exécute sur une page web que vous ouvrez, en plus du code de la page elle-même. Les navigateurs les acceptent depuis longtemps grâce à des modules comme Tampermonkey.

Depuis Manifest V3, le format actuel des extensions Chrome, le navigateur fait une distinction nette. Le code livré dans le paquet de l'extension sur la boutique est vérifié avec l'extension. Le code qu'une extension ajoute ensuite, après son installation, est traité comme un script utilisateur, et le navigateur ne l'exécute qu'une fois que vous l'avez explicitement autorisé. Firefox suit la même logique avec sa propre demande d'autorisation.

## Pourquoi les présences sont des scripts utilisateur

Chaque présence Nowly est le code qui sait comment fonctionne un site : où YouTube place le titre de la vidéo, comment Netflix expose le numéro d'épisode, quand Spotify est en lecture ou en pause. Il en existe plus de 40, et les sites changent souvent leur mise en page.

Si chaque présence était intégrée à l'extension, chaque correction demanderait une nouvelle version de l'extension et un nouvel examen par la boutique, et vous transporteriez du code pour des dizaines de sites que vous ne visitez jamais. À la place, l'extension reste légère, et les présences s'installent séparément depuis la [bibliothèque](/library) :

- Vous n'installez que les plateformes que vous utilisez.
- Une présence cassée peut être corrigée et republiée en quelques heures, sans mettre à jour l'extension.
- Une présence ne s'exécute que sur les adresses prévues pour elle. La présence YouTube, par exemple, tourne sur `www.youtube.com` et `m.youtube.com`, et nulle part ailleurs.

## Comment Nowly sécurise les présences

C'est justement parce qu'il s'agit de code téléchargé que les navigateurs demandent votre accord. Nowly ajoute donc ses propres contrôles :

- Chaque présence officielle est signée par l'équipe Nowly avec une clé ECDSA P-256. Avant d'enregistrer un script, l'extension vérifie la signature et les empreintes SHA-256 du code et de ses métadonnées. Un script modifié après sa signature est refusé.
- Le code source de chaque présence est public : chacun peut lire ce qu'elle fait avant de l'installer.
- Les présences transmettent ce qu'elles trouvent à l'extension, qui le passe à l'application de bureau sur votre ordinateur, puis à Discord. Rien dans ce chemin ne passe par les serveurs de Nowly, et le code des présences est relu avant d'être signé.
- Les paquets non signés ne sont acceptés que par les versions de développement chargées à la main, jamais par la version de la boutique.

## L'activer dans Chrome, Edge, Brave et Opera

1. Ouvrez la page des extensions : `chrome://extensions` dans Chrome, `edge://extensions` dans Edge, `brave://extensions` dans Brave ou `opera://extensions` dans Opera.
2. Trouvez **Nowly** et cliquez sur **Détails**.
3. Activez **Autoriser les scripts utilisateur**.
4. Rechargez les onglets des sites que vous voulez afficher sur Discord.

Sur les anciennes versions de Chrome et des navigateurs Chromium, l'option **Autoriser les scripts utilisateur** n'existe pas encore. Les scripts utilisateur dépendent alors du **Mode développeur**, en haut à droite de la page des extensions. L'activer ne change rien à la façon dont la version de Nowly issue de la boutique est mise à jour ou vérifiée.

## L'activer dans Firefox

Firefox pose la question une seule fois, pendant la présentation de Nowly, avec sa propre fenêtre d'autorisation. Acceptez-la et c'est terminé.

Si vous l'avez refusée, ouvrez `about:addons`, sélectionnez **Nowly**, ouvrez l'onglet **Permissions** et autorisez la permission liée aux scripts utilisateur. Rechargez ensuite les onglets à afficher.

## Vérifier que c'est bon

Ouvrez le panneau latéral de Nowly avec **Ctrl+Maj+Y** (**Cmd+Maj+Y** sur Mac). Dans le diagnostic, la ligne **Scripts utilisateur autorisés** doit maintenant être verte. Dès qu'elle l'est, Nowly enregistre les présences que vous avez installées, et la ligne suivante à regarder est **Activité détectée** sur une page prise en charge.

Si la ligne reste rouge après avoir activé l'autorisation :

- Rechargez l'extension depuis la page des extensions, ou redémarrez le navigateur.
- Vérifiez que vous avez modifié le réglage de Nowly et pas celui d'une autre extension.
- Si votre navigateur est géré par une école ou une entreprise, ses règles peuvent bloquer les scripts utilisateur pour toutes les extensions.

## Ce que l'autorisation ne permet pas

Autoriser les scripts utilisateur ne donne à Nowly aucun accès à vos mots de passe, à vos autres extensions ni à vos fichiers. Cela permet à l'extension d'enregistrer des scripts pour des sites précis, et le navigateur continue d'appliquer la liste d'adresses de chaque script. Nowly ne s'en sert pas pour lire des pages qu'aucune présence installée ne prend en charge.

Vous pouvez retirer l'autorisation à tout moment. Les présences s'arrêtent alors et Discord n'affiche plus votre activité, mais rien n'est supprimé : réactivez-la et tout reprend là où vous en étiez.

## En résumé

Les scripts utilisateur permettent à Nowly de prendre en charge des dizaines de sites avec une extension légère, de corriger vite les présences et de n'installer que ce dont vous avez besoin. L'autorisation se donne une fois par navigateur, et chaque présence qui l'utilise est signée, publique et limitée à ses propres sites.
