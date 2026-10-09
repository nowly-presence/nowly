---
title: La Rich Presence Discord ne s'affiche pas ? La liste de vérifications qui marche
description: Votre statut Discord reste vide pendant que vous regardez ou écoutez ? Suivez ces vérifications dans l'ordre, des réglages de Discord jusqu'à la page ouverte.
category: troubleshooting
order: 1
updated: 2026-10-07
related: discord-ipc-access-denied, nowly-on-linux, allow-user-scripts
---

Une Rich Presence passe par une chaîne de cinq maillons : la page ouverte, la présence de ce site, l'extension du navigateur, l'application de bureau et l'application Discord. Quand votre statut reste vide, l'un de ces maillons est cassé, et le plus rapide est de trouver lequel plutôt que de tout réinstaller. Suivez les vérifications ci-dessous dans l'ordre. La plupart des problèmes se règlent dans les quatre premières.

## Commencez par le diagnostic de Nowly

Ouvrez le panneau latéral de Nowly (**Ctrl+Maj+Y**, ou **Cmd+Maj+Y** sur Mac) sur l'onglet que vous voulez partager. Le diagnostic affiche six lignes : **Extension installée**, **Scripts utilisateur autorisés**, **Nowly Desktop détecté**, **Discord connecté**, **Une présence est installée** et **Activité détectée**.

Lisez-les de haut en bas et arrêtez-vous à la première qui n'est pas verte. Chaque partie ci-dessous correspond à l'une d'elles, avec en plus quelques cas que le diagnostic ne peut pas voir depuis votre navigateur.

## 1. Vous utilisez l'application Discord pour ordinateur

La Rich Presence ne fonctionne qu'avec l'application Discord installée sur votre ordinateur. Discord dans un onglet, sur votre téléphone ou sur un autre ordinateur n'affichera rien, même connecté au même compte.

Si vous utilisez les deux, fermez la version navigateur de Discord : elle peut vous faire croire que votre statut est vide alors que l'application l'affiche à tout le monde.

## 2. Discord a le droit d'afficher votre activité

Discord peut masquer votre activité même quand il la reçoit :

- Ouvrez **Paramètres utilisateur**, puis **Confidentialité des activités**, et activez l'option qui partage votre activité actuelle.
- Vérifiez votre statut. **Invisible** masque votre activité pour tout le monde.
- Certains serveurs permettent de couper le partage d'activité pour ce serveur seulement, dans ses paramètres de confidentialité. Si un ami d'un serveur ne la voit pas alors que les autres la voient, regardez là.

Un moyen simple de faire la différence : si votre propre profil affiche l'activité mais qu'un ami ne la voit pas, le problème vient d'un réglage de confidentialité de Discord, pas de Nowly.

## 3. L'application de bureau est installée et lancée

Si **Nowly Desktop détecté** est rouge, l'extension ne joint pas l'application de bureau.

- Installez-la depuis la [page de l'application de bureau](/desktop) si ce n'est pas fait, puis cliquez sur **Vérifier la connexion** dans le panneau latéral.
- Si vous venez de l'installer, fermez et rouvrez le panneau latéral, ou redémarrez le navigateur pour qu'il prenne en compte la nouvelle application.
- Installez l'application sur le même ordinateur que le navigateur. Elle ne fonctionne pas d'une machine à l'autre.
- Sous Linux, les causes les plus fréquentes sont un `.deb` qui n'a jamais vraiment été installé, ou un navigateur installé via Flatpak ou Snap. Voir [Nowly sous Linux](/guides/nowly-on-linux).

## 4. Discord est connecté

Si **Nowly Desktop détecté** est vert mais **Discord connecté** est rouge, l'application de bureau n'arrive pas à parler à Discord.

- Lancez l'application Discord, attendez qu'elle soit complètement chargée, puis cliquez sur **Vérifier la connexion**.
- Sous Windows, la cause la plus fréquente est Discord lancé en administrateur. La correction prend une minute : [Corriger « Accès refusé » sur discord-ipc-0](/guides/discord-ipc-access-denied).
- Si vous lancez Discord PTB ou Canary à côté de Discord classique, n'en gardez qu'un seul ouvert.

## 5. Les scripts utilisateur sont autorisés

Si **Scripts utilisateur autorisés** est rouge, le navigateur bloque les présences. Activez **Autoriser les scripts utilisateur** dans la page de détails de Nowly (ou le **Mode développeur** sur les anciennes versions de Chrome), puis rechargez l'onglet. Les étapes complètes pour chaque navigateur sont dans [Pourquoi Nowly vous demande d'autoriser les scripts utilisateur](/guides/allow-user-scripts).

## 6. La bonne présence est installée et activée

Chaque site a besoin de sa propre présence. Si **Une présence est installée** est vert mais que rien ne se passe sur un site, ouvrez la page de ce site dans la [bibliothèque](/library) et vérifiez qu'elle indique **Installée**. Ensuite, dans le panneau latéral :

- Vérifiez que la présence est activée.
- Vérifiez que le partage n'est pas en pause. Dans ce cas, le panneau indique que le partage est en pause. Reprenez avec le bouton pause ou **Ctrl+Maj+U**.
- Vérifiez que la présence n'est pas mise en veille et que vous n'êtes pas **Hors de vos horaires** si vous avez défini des horaires de partage.
- Vérifiez que l'onglet lui-même n'est pas masqué avec **Masquer cet onglet**.

## 7. La page est prise en charge par la présence

**Activité détectée** reste rouge quand la présence n'a rien à afficher sur la page actuelle. Deux raisons expliquent presque tous les cas :

- **Vous naviguez, vous ne regardez pas.** La plupart des présences ne partagent que ce que vous lisez vraiment : une vidéo, un épisode, un morceau, un direct. Sur la plupart d'entre elles, les pages d'accueil, la recherche et les catalogues n'affichent rien, sauf si vous activez **Afficher l'activité de navigation** dans les réglages de cette présence. La page de chaque présence dans la bibliothèque explique ce qu'elle affiche par défaut.
- **L'adresse n'est pas prise en charge.** Chaque présence liste les adresses où elle fonctionne, sous **Sites compatibles** sur sa page de la bibliothèque. Prime Video, par exemple, fonctionne sur `primevideo.com`. Si le site a changé d'adresse ou de mise en page, utilisez **Signaler un problème** sur la page de la présence.

Après avoir installé une présence ou changé un réglage, rechargez l'onglet une fois. Une page ouverte avant l'installation de la présence ne l'a pas encore.

## 8. Aucun autre outil de Rich Presence n'interfère

D'autres outils qui modifient votre activité Discord, comme PreMiD ou un lecteur de musique avec sa propre Rich Presence, peuvent remplacer ou effacer ce que Nowly envoie. Coupez-les pendant vos tests. Un jeu en cours peut aussi prendre la place de l'activité affichée sur votre profil.

## 9. Toujours rien ?

- Rechargez l'onglet, puis redémarrez le navigateur et Discord. Cela paraît basique, mais cela recrée chaque connexion de la chaîne.
- Mettez à jour l'extension, l'application de bureau et Discord.
- Ouvrez les journaux de l'extension et cliquez sur **Copier les journaux** pour les coller dans un ticket. Ils peuvent contenir les adresses des pages compatibles que vous avez visitées : relisez-les avant de les partager.
- Ouvrez un ticket sur le serveur Discord de Nowly, ou signalez la présence depuis sa page de la bibliothèque si un seul site est concerné.

## La chaîne, en une phrase

La page doit être prise en charge, la présence installée et active, les scripts utilisateur autorisés, l'application de bureau joignable, Discord ouvert et autorisé à afficher votre activité. Trouvez le premier maillon qui échoue, corrigez-le, et le reste suit en général.
