---
title: Installer Nowly et afficher votre activité sur Discord
description: Le guide complet, de l'extension à l'application de bureau, jusqu'à votre première présence et aux vérifications qui confirment que tout fonctionne.
category: start
order: 1
updated: 2026-10-07
related: allow-user-scripts, rich-presence-not-showing, control-what-discord-shows
---

Nowly affiche ce que vous regardez, écoutez ou consultez sur des sites web sous forme de Rich Presence Discord : la carte sous votre pseudo, avec un titre, une image, une barre de progression et parfois un bouton. L'installation prend environ cinq minutes et demande trois éléments : une extension de navigateur, une petite application de bureau, et une présence par site que vous voulez afficher. Ce guide les reprend dans l'ordre et se termine par les vérifications qui confirment que tout est relié.

## Ce qu'il vous faut avant de commencer

- **Un ordinateur** : Windows 10 ou 11, macOS 11 Big Sur ou plus récent, ou une distribution Linux 64 bits.
- **Un navigateur** : Chrome, Edge, Brave, Opera ou un autre navigateur Chromium, ou Firefox.
- **L'application Discord pour ordinateur**, installée et connectée. Discord dans un onglet ou sur votre téléphone ne peut pas recevoir de Rich Presence d'un autre programme : il ne fonctionnera pas avec Nowly.

Aucun compte Nowly n'est nécessaire. Tout ce qui suit est gratuit.

## Étape 1 : installer l'extension

Ouvrez la [page de l'extension](/extension) depuis le navigateur que vous utilisez tous les jours. Le bouton mène à la bonne boutique : le Chrome Web Store pour Chrome, Edge, Brave et Opera, et les modules complémentaires Firefox pour Firefox. Cliquez sur **Ajouter**, confirmez, puis épinglez l'icône Nowly dans la barre d'outils pour l'avoir sous la main.

Nowly s'ouvre dans le panneau latéral du navigateur (la barre latérale dans Firefox). Ouvrez-le avec l'icône ou avec **Ctrl+Maj+Y** (**Cmd+Maj+Y** sur Mac). La première fois, une courte présentation explique chaque étape. Vous pouvez la suivre ou continuer ici : les étapes sont les mêmes.

## Étape 2 : autoriser les scripts utilisateur

Chaque présence est un petit script qui ne s'exécute que sur le site pour lequel elle a été écrite. Les navigateurs appellent cela des scripts utilisateur et demandent votre accord avant de les lancer.

- **Chrome, Edge, Brave, Opera** : ouvrez `chrome://extensions` (ou `edge://extensions`, `brave://extensions`, `opera://extensions`), trouvez Nowly, cliquez sur **Détails** et activez **Autoriser les scripts utilisateur**. Sur les anciennes versions de Chrome, cette option n'existe pas encore : activez plutôt le **Mode développeur** en haut à droite de la page des extensions.
- **Firefox** : la présentation demande l'autorisation une seule fois. Acceptez-la.

Pour savoir exactement ce que cette autorisation permet, lisez [Pourquoi Nowly vous demande d'autoriser les scripts utilisateur](/guides/allow-user-scripts).

## Étape 3 : installer l'application de bureau

Discord n'accepte une Rich Presence que d'un programme qui tourne sur le même ordinateur, par une connexion locale qu'un site ou une extension ne peut pas ouvrir seul. L'application de bureau Nowly (appelée Nowly Desktop dans l'extension) est ce programme. Elle n'a pas de fenêtre : votre navigateur la lance quand Nowly en a besoin, et elle transmet votre activité à Discord.

Ouvrez la [page de l'application de bureau](/desktop). Elle détecte votre système et propose le bon fichier.

- **Windows** : lancez l'installateur. L'application n'est pas encore signée avec un certificat payant, donc Windows SmartScreen peut afficher un avertissement. Choisissez **Informations complémentaires**, puis **Exécuter quand même**, uniquement pour un fichier téléchargé sur nowly.me.
- **macOS** : ouvrez l'image disque et suivez les instructions. L'application est notarisée par Apple, Gatekeeper l'accepte donc.
- **Linux** : sur Debian, Ubuntu ou Mint, installez le paquet `.deb`. Sur les autres distributions, téléchargez l'archive et lancez le script d'installation qu'elle contient. En cas de souci, consultez [Nowly sous Linux](/guides/nowly-on-linux).

## Étape 4 : ouvrir Discord et vérifier son réglage d'activité

Lancez l'application Discord et laissez-la ouverte. Vérifiez ensuite que Discord a le droit d'afficher votre activité : ouvrez **Paramètres utilisateur**, puis **Confidentialité des activités**, et assurez-vous que le partage de votre activité actuelle est activé. Le libellé exact change selon les versions de Discord, mais c'est l'option qui parle de votre activité ou de votre message de statut.

Gardez aussi en tête qu'avec le statut **Invisible**, personne ne voit votre activité, quoi que Nowly envoie.

## Étape 5 : installer votre première présence

Les présences se trouvent dans la [bibliothèque](/library). YouTube est le meilleur premier test, car une vidéo démarre en quelques secondes :

1. Ouvrez la [présence YouTube](/library/youtube).
2. Attendez que la page détecte l'extension, puis cliquez sur **Installer**.
3. Ouvrez une vidéo sur YouTube et lancez la lecture.

Vous pouvez aussi installer des présences sans quitter le panneau latéral : l'onglet **Bibliothèque** de l'extension affiche le même catalogue. Chaque présence est vérifiée par une signature numérique avant d'être installée.

## Étape 6 : lire le diagnostic

Ouvrez le panneau latéral de Nowly. Le diagnostic affiche six vérifications, et chacune passe au vert quand elle est prête :

| Vérification | Ce qu'elle signifie |
| --- | --- |
| Extension installée | L'extension tourne dans ce navigateur. |
| Scripts utilisateur autorisés | Le navigateur laisse Nowly lancer les présences. |
| Nowly Desktop détecté | L'application de bureau a répondu à l'extension. |
| Discord connecté | L'application de bureau a joint l'application Discord. |
| Une présence est installée | Au moins une présence est installée. |
| Activité détectée | Une présence a trouvé quelque chose à afficher dans l'onglet actuel. |

Quand les six sont vertes, regardez votre profil Discord : vous devriez voir **Regarde YouTube** avec le titre de la vidéo, la chaîne, la miniature et une barre de progression. Si une ligne reste rouge, corrigez-la en premier : c'est toujours le maillon suivant de la chaîne. La [liste de dépannage](/guides/rich-presence-not-showing) couvre tous les cas.

## Ce que voient vos amis

Avec la présence YouTube, une vidéo en lecture affiche son titre, le nom de la chaîne, la miniature et le temps écoulé, ainsi qu'un bouton **Voir la vidéo**. Quand vous mettez en pause, une icône pause remplace l'icône lecture. Parcourir l'accueil ou la recherche de YouTube n'affiche rien par défaut : la plupart des présences ne partagent que ce que vous regardez ou écoutez vraiment, et l'activité de navigation est une option à activer présence par présence.

## Et ensuite

- Ajoutez les plateformes que vous utilisez vraiment depuis la [bibliothèque](/library) : Netflix, Twitch, Crunchyroll, Spotify et plus de 40 autres.
- Apprenez à mettre en pause, masquer un onglet ou ne partager qu'à certaines heures dans [Choisir exactement ce que Discord affiche](/guides/control-what-discord-shows).
- Curieux de savoir ce qui se passe en coulisses ? Lisez [Qu'est-ce que la Rich Presence Discord ?](/guides/what-is-discord-rich-presence)
