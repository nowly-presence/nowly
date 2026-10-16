---
title: Créer votre propre activité Discord avec Nowly
description: Créer une activité personnalisée dans Nowly 2.4.0, choisir un modèle, ajouter textes, images, minuteur et boutons, puis l'afficher sur Discord.
category: start
order: 5
updated: 2026-10-16
related: share-custom-activities, custom-activity-images, set-up-nowly, rich-presence-not-showing
---

Une session de révisions, un projet de code ou une soirée jeux ne correspond pas toujours à un site web. Depuis Nowly 2.4.0, l'onglet **Perso** permet d'écrire vous-même une activité Discord, sans installer de présence de site. Elle ne suit pas automatiquement ce que vous faites : c'est vous qui choisissez son contenu et quand l'activer.

> Les captures montrent l'aperçu de développement de Nowly en anglais, avec des données simulées. Elles illustrent l'interface de l'extension, pas une connexion ou un profil Discord réels.

## Avant de commencer

- Mettez l'extension à jour vers **2.4.0 ou une version plus récente**.
- Pour publier sur Discord, ouvrez **Nowly Desktop** et l'application **Discord pour ordinateur**. Vérifiez la connexion dans le panneau de l'extension.
- Si vous découvrez Nowly, suivez d'abord [Configurer Nowly](/guides/set-up-nowly). Un compte Nowly n'est pas nécessaire pour créer une activité.

L'aperçu de l'éditeur n'est pas une confirmation de publication : Discord doit être connecté et autoriser l'affichage des activités.

## Choisir un modèle ou partir de zéro

![Onglet Custom de Nowly avec la liste des activités, l'icône Import et le bouton Create](https://images.nowly.me/guides-screenshots/custom-activities/01-activity-list.png "Ouvrez Perso, nommé Custom en anglais, pour créer ou importer une activité.")

1. Ouvrez le panneau latéral de Nowly, puis **Perso**.
2. Si la liste est vide, choisissez **Créer une activité** pour partir de zéro, ou **Partir d'un modèle**.
3. Si vous avez déjà des activités, choisissez **Créer** pour ouvrir les **Modèles**. **Vierge** permet de partir de zéro.
4. Choisissez un modèle, par exemple Révisions, Code ou Pause café, puis adaptez-le dans l'éditeur.

Les neuf modèles sont des points de départ : ils ne créent pas d'activité tant que vous n'enregistrez pas. Avec **Vierge**, le sélecteur propose dix choix sur cinq lignes. Vous pouvez conserver jusqu'à **50 activités par appareil**.

![Sélecteur de modèles avec les choix Blank, Studying, Coding et les autres modèles d'activité](https://images.nowly.me/guides-screenshots/custom-activities/02-templates.png "Choisissez Vierge, nommé Blank en anglais, ou adaptez un modèle existant.")

## Renseigner les textes

Dans **Texte**, remplissez les champs en vous aidant de l'**Aperçu** :

| Champ | Exemple | Utilité |
| --- | --- | --- |
| Nom | Révisions de physique | Nom de l'activité visible sur Discord |
| Type | Joue | Présentation Discord : Joue, Écoute, Regarde ou Participe |
| Première ligne | Chapitre 3 : thermodynamique | Détail principal de l'activité |
| Deuxième ligne | Session de concentration | Information complémentaire facultative |

Le nom doit contenir entre **2 et 128 caractères**. Les deux lignes sont facultatives ; lorsqu'elles sont remplies, elles doivent aussi contenir entre 2 et 128 caractères. Si un champ est refusé, corrigez l'erreur indiquée avant d'enregistrer.

Discord présente le nom différemment selon le type : **Joue** le garde sur une ligne distincte ; **Écoute**, **Regarde** et **Participe** l'intègrent à l'en-tête. Le type ne lance pas de musique, de vidéo ou de jeu.

![Éditeur avec l'activité Physics revision dans l'aperçu et les champs de nom, de type et des deux lignes](https://images.nowly.me/guides-screenshots/custom-activities/03-editor-preview.png "Vérifiez vos textes dans l'aperçu avant d'activer l'activité.")

## Ajouter des images, un temps et des boutons

Dans **Images**, configurez la **Grande image** et éventuellement la **Petite image**. Chaque image peut venir d'un fichier, d'un lien HTTPS ou d'une icône colorée. Le **Texte au survol** est facultatif. Consultez [Choisir les images d'une activité](/guides/custom-activity-images) pour les formats, les limites et la confidentialité.

Dans **Temps**, choisissez **Temps écoulé** ou **Compte à rebours**. Le compte à rebours va de **5 minutes à 24 heures**. Le temps démarre lorsque vous activez l'activité, pas quand vous la créez. Un nouveau démarrage après désactivation recommence le minuteur. Il n'existe pas d'option pour masquer complètement le temps.

Dans **Boutons**, ajoutez jusqu'à **deux boutons** avec chacun un libellé et un lien **HTTPS**. Utilisez des adresses que vous acceptez de partager avec les personnes qui voient votre profil. Un bouton non configuré peut rester absent.

![Réglages du temps avec un compte à rebours de 25 minutes et le bouton Add a button](https://images.nowly.me/guides-screenshots/custom-activities/05-timer-and-buttons.png "Choisissez un minuteur et ajoutez éventuellement des boutons HTTPS.")

## Enregistrer puis afficher sur Discord

1. Choisissez **Enregistrer** en haut de l'éditeur, ou **Créer l'activité** en bas pour une nouvelle activité.
2. Dans la liste, activez l'interrupteur de cette activité. Vous pouvez aussi ouvrir une activité enregistrée et utiliser **Afficher sur Discord**.
3. Vérifiez la carte **Sur Discord** dans l'onglet **Perso**, puis votre profil dans Discord.

**Une seule activité personnalisée est active à la fois.** En activer une autre remplace la précédente. Tant qu'une activité personnalisée est active, elle prend la priorité sur les activités des onglets ; celles-ci ne sont pas désinstallées.

![Onglet Custom avec la carte On Discord, le bouton Stop et l'interrupteur d'une activité activé](https://images.nowly.me/guides-screenshots/custom-activities/10-active-activity.png "L'état actif et le bouton Arrêter, nommé Stop en anglais, dans l'aperçu de développement.")

> La pause générale de Nowly masque aussi les activités personnalisées. En revanche, en 2.4.0, les horaires des présences de sites ne pilotent pas une activité personnalisée : désactivez-la ou utilisez la pause générale pour arrêter sa diffusion.

Pour revenir aux activités de vos onglets, désactivez l'interrupteur ou choisissez **Arrêter** sur la carte active. Une activité de site reprend si un onglet éligible en fournit une et si les conditions habituelles de partage sont remplies.

## Modifier, supprimer et conserver vos activités

- Cliquez sur une activité pour la modifier, puis **Enregistrer**. Quitter l'éditeur sans enregistrer ne conserve pas vos modifications.
- **Supprimer l'activité** ouvre une confirmation. L'effacement est définitif pour cette copie ; exportez-la auparavant si vous voulez la garder.
- Les activités restent sur cet appareil et **ne sont pas synchronisées avec votre compte Nowly**. Utilisez [l'export et l'import JSON](/guides/share-custom-activities) pour les partager, les sauvegarder ou les transférer.

## Si rien n'apparaît sur Discord

Vérifiez d'abord que l'activité est enregistrée et activée, que Nowly n'est pas en pause, puis que Nowly Desktop et Discord sont connectés. Vérifiez aussi les réglages de confidentialité des activités dans Discord. Le [guide de dépannage Rich Presence](/guides/rich-presence-not-showing) détaille ces vérifications.
