---
title: Partager, importer et sauvegarder vos activités personnalisées
description: Exporter une activité Nowly en JSON avec ses images, importer un ou plusieurs fichiers et résoudre les erreurs sans activer une activité par accident.
category: discord
order: 3
updated: 2026-10-16
related: create-custom-discord-activity, custom-activity-images, control-what-discord-shows
---

Les activités personnalisées ne sont pas synchronisées avec votre compte Nowly. Pour transmettre un modèle à un ami, le transférer dans un autre navigateur ou conserver une sauvegarde, utilisez un fichier **JSON** depuis Nowly **2.4.0 ou une version plus récente**. Vous pouvez importer une activité sans la publier sur Discord.

> Les captures montrent l'aperçu de développement de Nowly en anglais, avec des données simulées. Elles illustrent l'interface de l'extension, pas une connexion ou un profil Discord réels.

## Exporter une activité enregistrée

1. Dans **Perso**, ouvrez l'activité à partager.
2. Si vous venez de la modifier, choisissez **Enregistrer**, puis ouvrez-la à nouveau.
3. Descendez sous **Boutons** et choisissez **Exporter**.
4. Votre navigateur télécharge un fichier portant le nom de l'activité, par exemple `Révisions de physique.json`. Les caractères interdits dans les noms de fichiers sont remplacés.

**Exporter** est disponible uniquement pour une activité déjà enregistrée. Il exporte sa dernière version sauvegardée, pas les modifications encore ouvertes dans l'éditeur. Le fichier peut ensuite être transmis par le moyen de votre choix ; Nowly ne l'envoie pas automatiquement à quelqu'un.

![Bas de l'éditeur d'une activité enregistrée avec les boutons Save, Export et Delete activity](https://images.nowly.me/guides-screenshots/custom-activities/06-export-button.png "Exporter, nommé Export en anglais, télécharge l'activité enregistrée au format JSON.")

## Ce que contient le fichier

- Le nom, le type, les deux lignes de texte, les textes au survol, le minuteur et les boutons.
- Les icônes et leurs couleurs, ainsi que les liens HTTPS configurés pour les images.
- Les fichiers image envoyés, embarqués à partir de leurs copies locales. Si une copie manque sur votre appareil, cette image est exportée comme absente.
- Une indication du format Nowly, de sa version et de la date de l'export.

Le fichier **ne contient pas** l'identifiant local de l'activité, ses dates de création/modification, son état d'activation, votre jeton appareil ou les URLs d'hébergement des images envoyées.

> Les textes, images embarquées et liens que vous avez saisis restent dans le fichier. Retirez toute information privée avant de le partager. Une sauvegarde contenant des images peut être plus volumineuse qu'un simple fichier de réglages.

## Importer un ou plusieurs fichiers

1. Ouvrez **Perso**.
2. En haut de la liste, utilisez le bouton à icône **Importer**. Son infobulle indique son rôle.
3. Sélectionnez un ou plusieurs fichiers `.json` exportés par Nowly.
4. Attendez la fin de l'import. Si un seul fichier a été importé avec succès, son éditeur s'ouvre pour vérification. Si plusieurs réussissent, un message indique leur nombre.
5. Vérifiez le nom, les textes, les images et les destinations des boutons avant d'activer **Afficher sur Discord**.

![Activité importée ouverte dans l'éditeur avec l'interrupteur Show on Discord désactivé](https://images.nowly.me/guides-screenshots/custom-activities/08-imported-activity.png "Vérifiez l'activité importée avant de l'activer.")

Vous pouvez aussi glisser les fichiers depuis votre gestionnaire de fichiers sur l'onglet **Perso** : **Déposez pour importer** apparaît. Relâchez les fichiers sur le panneau. Cette zone n'est active que lorsque Perso est visible, sans éditeur ni fenêtre de modèles ouverte.

![Zone Drop to import invitant à déposer un fichier JSON d'activité Nowly](https://images.nowly.me/guides-screenshots/custom-activities/07-drop-to-import.png "Déposez un fichier JSON exporté sur l'onglet Perso, nommé Custom en anglais.")

**Chaque import crée une nouvelle activité désactivée.** Il ne remplace pas une activité existante, même si le nom est identique, et ne coupe pas l'activité déjà en cours. Importer deux fois le même fichier crée donc deux copies. La limite de **50 activités par appareil** reste applicable.

## Les images à l'import

Les images embarquées sont vérifiées puis envoyées à Nowly pour obtenir des URLs utilisables par Discord sur votre appareil. Une connexion réseau et un service d'images disponible sont nécessaires pour cette étape ; les limites habituelles d'envoi s'appliquent.

Si une image ne peut pas être importée, l'activité est tout de même créée, sans cette image, avec le message **Une image n'a pas pu être importée, elle a été laissée vide.** Ouvrez l'éditeur pour la remplacer. Les icônes colorées ne demandent pas d'import de fichier image ; les liens HTTPS sont conservés comme liens.

## Comprendre les erreurs

| Message | Que faire |
| --- | --- |
| Ce fichier n'est pas une activité Nowly. | Utilisez un export d'activité Nowly, pas l'export général des données, un ZIP de présence ou un JSON quelconque. |
| Ce fichier vient d'une version plus récente de Nowly. Mettez l'extension à jour. | Mettez Nowly à jour et demandez à l'expéditeur de vérifier sa version. Ne modifiez pas le numéro de version dans le fichier pour forcer l'import. |
| Ce fichier est trop volumineux. | La limite est de 4 Mio par fichier. Réduisez les images dans l'activité d'origine puis exportez-la à nouveau. |
| Ce fichier d'activité est invalide ou incomplet. | Le nom, les champs, les liens ou une image ne passent pas la validation. Demandez un nouvel export au lieu de corriger au hasard le JSON. |
| Vous avez atteint la limite d'activités personnalisées. | Exportez celles à conserver puis supprimez des activités inutilisées avant de réessayer. |

Un fichier en erreur n'empêche pas les suivants d'être traités. Les imports simultanés sont bloqués pendant le traitement ; attendez sa fin avant de recommencer.

![Onglet Custom affichant l'erreur This file is not a Nowly activity après un import invalide](https://images.nowly.me/guides-screenshots/custom-activities/09-invalid-file.png "Un fichier JSON sans rapport avec Nowly est refusé sans créer d'activité.")

## Faire une sauvegarde ou changer de navigateur

Exportez chaque activité que vous voulez garder, conservez les fichiers dans un emplacement de confiance, puis importez-les dans l'autre installation de Nowly. L'export se fait **activité par activité**, pas en une archive de toute la collection. Vérifiez les images après le transfert, puis activez manuellement celle que vous souhaitez utiliser.

Ce partage ne remplace pas l'export de données personnelles dans les réglages. Il est dédié aux activités réutilisables. Pour créer une activité avant de la partager, consultez [Créer votre propre activité Discord](/guides/create-custom-discord-activity).
