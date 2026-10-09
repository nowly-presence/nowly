---
title: Corriger « Accès refusé » sur discord-ipc-0 (Windows)
description: Pourquoi Windows bloque la connexion entre Nowly et Discord quand Discord tourne en administrateur, et les cinq étapes qui règlent le problème pour de bon.
category: troubleshooting
order: 2
updated: 2026-10-07
related: rich-presence-not-showing, what-is-discord-rich-presence, set-up-nowly
---

Sous Windows, il arrive que Nowly affiche **Nowly Desktop détecté** en vert mais **Discord connecté** en rouge, et que les journaux contiennent une ligne comme celle-ci (le message système peut être en anglais ou en français selon votre Windows) :

```text
open \\.\pipe\discord-ipc-0: Access is denied.
```

Nowly peut aussi afficher un message expliquant que Discord bloque la connexion, et l'application de bureau peut l'indiquer par une notification Windows. La cause est presque toujours la même, et ce n'est un bug ni de Nowly ni de Discord : Discord tourne avec les droits administrateur alors que votre navigateur, non.

## Qu'est-ce que discord-ipc-0

Les programmes qui veulent modifier votre activité Discord, jeux compris, parlent à l'application Discord par un canal local appelé canal nommé (named pipe). Sous Windows, le premier s'appelle `\\.\pipe\discord-ipc-0`. Discord le crée au démarrage, et l'application de bureau Nowly l'ouvre pour envoyer votre activité.

Rien ne passe par Internet à cette étape. C'est une conversation entre deux programmes du même ordinateur.

## Pourquoi Windows répond « Accès refusé »

Windows sépare les programmes lancés en administrateur des programmes normaux. Un programme lancé avec **Exécuter en tant qu'administrateur** tourne à un niveau d'intégrité plus élevé, et les objets qu'il crée, dont le canal nommé de Discord, sont protégés contre les programmes de niveau normal.

Votre navigateur tourne au niveau normal, donc l'application de bureau Nowly qu'il lance aussi. Quand Discord a été lancé en administrateur, Windows refuse que l'application de niveau normal ouvre ce canal, et la connexion échoue avec **Accès refusé**.

Les jeux et les autres outils de Rich Presence se heurtent exactement au même mur. C'est pour cela que « Discord n'affiche pas mon jeu » et cette erreur vont souvent ensemble.

## La correction, étape par étape

1. **Quittez complètement Discord.** Fermer la fenêtre ne suffit pas : faites un clic droit sur l'icône Discord dans la zone de notification, près de l'horloge, et choisissez **Quitter Discord**.
2. **Vérifiez qu'aucun processus Discord ne reste.** Ouvrez le Gestionnaire des tâches avec **Ctrl+Maj+Échap** et terminez tout processus `Discord.exe` restant.
3. **Retirez le réglage administrateur.** Faites un clic droit sur le raccourci Discord que vous utilisez, choisissez **Propriétés**, ouvrez l'onglet **Compatibilité** et décochez **Exécuter ce programme en tant qu'administrateur**. Toujours dans **Propriétés**, onglet **Raccourci**, cliquez sur **Avancé** et vérifiez que **Exécuter en tant qu'administrateur** est aussi décoché. Si le bouton **Modifier les paramètres pour tous les utilisateurs** montre l'option cochée, décochez-la là aussi.
4. **Relancez Discord normalement**, par un simple double-clic.
5. **Reconnectez Nowly.** Cliquez sur **Reconnecter** dans le panneau latéral de Nowly, ou redémarrez votre navigateur.

**Discord connecté** doit maintenant passer au vert, et votre activité apparaître en quelques secondes.

## Si Discord continue de démarrer en administrateur

- Vérifiez chaque raccourci que vous utilisez : bureau, menu Démarrer, barre des tâches. Chacun a ses propres réglages.
- Si Discord démarre avec Windows, il peut être lancé par une tâche planifiée ou par un gestionnaire de démarrage réglé sur les privilèges les plus élevés. Retirez cette option ou recréez l'entrée sans elle.
- Certaines personnes lancent Discord en administrateur pour que le push-to-talk fonctionne dans des jeux eux-mêmes lancés en administrateur. Dans ce cas, il faut choisir : soit Discord et le jeu tournent normalement, soit la Rich Presence de votre navigateur ne peut pas joindre Discord.

## Ce qu'il ne faut pas faire

Ne lancez pas votre navigateur, et ne forcez pas l'application de bureau Nowly, en administrateur pour contourner le problème. Le navigateur lance lui-même l'application de bureau par un mécanisme appelé native messaging, et un navigateur avec tous les droits administrateur expose l'ensemble de votre système au moindre problème sur une page web. La bonne correction consiste toujours à ramener Discord au niveau normal.

## Discord PTB et Canary

Sous Windows, l'application de bureau Nowly se connecte au premier canal de Discord, `discord-ipc-0`. Si vous lancez en même temps Discord classique et Discord PTB ou Canary, celui qui a démarré en premier possède ce canal, et votre activité n'apparaît que dans celui-là. Gardez une seule application Discord ouverte pour éviter les surprises.

## Toujours bloqué ?

Si l'erreur a disparu mais que votre statut reste vide, le problème est plus loin dans la chaîne. Revenez à la [liste de dépannage](/guides/rich-presence-not-showing) et reprenez à l'étape **Scripts utilisateur autorisés**. Si les journaux indiquent toujours **Accès refusé** après les étapes ci-dessus, ouvrez un ticket sur le serveur Discord de Nowly en précisant votre version de Windows et la façon dont vous lancez Discord.
