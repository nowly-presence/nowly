---
title: Créer votre première présence Nowly
description: D'un dossier vide à une activité Discord qui fonctionne : les outils nécessaires, les fichiers d'une présence, un premier script, les tests en local et la publication.
category: developers
order: 1
updated: 2026-10-07
related: what-is-discord-rich-presence, allow-user-scripts, nowly-vs-premid
---

Chaque plateforme de la bibliothèque Nowly existe parce que quelqu'un a écrit une présence pour elle. S'il manque un site que vous utilisez, vous pouvez l'ajouter vous-même. Une présence est un petit projet TypeScript, souvent moins de cent lignes pour une première version, et le CLI de Nowly s'occupe de la structure, de la compilation et des tests en local. Ce guide vous mène de rien à une présence qui met à jour votre statut Discord. La référence complète se trouve dans la [documentation de Nowly](https://docs.nowly.me/).

## Ce qu'il vous faut

- **Node.js 22 ou plus récent** et **pnpm**, pour lancer le CLI et compiler les présences.
- **Git**, pour cloner le dépôt des présences et ouvrir une pull request.
- **Un navigateur Chromium ou Firefox**, et l'**application Discord** avec l'[application de bureau Nowly](/desktop) installée, pour tester en conditions réelles.
- Des bases en JavaScript ou TypeScript, et les outils de développement du navigateur pour inspecter la page visée.

## Récupérer le dépôt et le CLI

Toutes les présences de la communauté vivent dans un même dépôt public, sous licence MIT :

```bash
git clone https://github.com/nowly-presence/presences.git
cd presences
pnpm install
pnpm i -g @nowly/cli
```

`pnpm install` relie aussi le paquet `@nowly/sdk`, qui donne à votre éditeur les types de l'API Presence.

## Créer la structure d'une présence

```bash
nowly init "Example"
```

Le CLI pose quelques questions et crée un dossier `src/E/Example/`, rangé selon la première lettre de la plateforme :

- `metadata.json` : le nom, l'auteur, les adresses prises en charge, la catégorie, la couleur, les descriptions et les réglages de la présence.
- `presence.ts` : le code qui lit la page et définit l'activité.
- `locales/` : les textes affichés sur Discord, un fichier par langue.
- `assets/` : le logo, l'icône et la miniature utilisés sur Discord et dans la bibliothèque.

Le CLI demande aussi si Discord affiche déjà cette plateforme grâce à un compte lié. Si c'est le cas, il le note dans la présence pour que la bibliothèque puisse le signaler.

## Décrire la plateforme dans metadata.json

Les champs les plus importants sont les adresses. `url` liste les noms d'hôte, et `regExp` est le motif que l'adresse d'une page doit respecter pour que la présence s'exécute. Gardez-les aussi précis que le site le permet : une présence ne doit jamais tourner sur des pages qu'elle ne comprend pas.

La `category` est une valeur parmi `streaming`, `music`, `video`, `social`, `gaming`, `tools`, `ai`, `learning`, `creator` et `other`. Les descriptions s'écrivent par langue, et l'anglais sert de valeur par défaut.

## Écrire une première présence

`Presence` et `Assets` sont fournis par l'environnement d'exécution. Seuls des outils comme `PresenceType` s'importent depuis le SDK :

```ts
import { PresenceType } from "@nowly/sdk"

const presence = new Presence()

presence.on("UpdateData", async () => {
  await presence.setActivity({
    details: document.title,
    state: document.location.hostname,
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
```

`UpdateData` se déclenche régulièrement tant que la page est ouverte, et chaque fois que l'utilisateur change un réglage. À chaque fois, lisez la page et envoyez l'activité. Quand il n'y a rien d'intéressant à afficher, appelez `presence.clearActivity()` plutôt que d'envoyer un statut vide.

Pour les médias, `createMediaTimestamps(video)` du SDK transforme un élément `audio` ou `video` en heures de début et de fin, ce dont Discord a besoin pour une barre de progression.

## Respecter les personnes qui l'utilisent

Les présences de la bibliothèque suivent quelques règles sur lesquelles les utilisateurs comptent :

- Afficher ce que la personne fait vraiment, pas tout ce qu'elle parcourt. Placez les pages de navigation derrière un réglage **Afficher l'activité de navigation**, désactivé par défaut.
- Proposer une option de confidentialité quand le contenu peut être personnel : un mode qui masque les titres, ou garder les conversations privées hors de Discord.
- N'envoyer aucune donnée ailleurs que dans l'activité, et ne pas lire plus que ce dont l'activité a besoin.
- Utiliser les textes traduits de `locales/` pour tout ce qui s'affiche sur Discord.

## Compiler et tester en local

Validez les métadonnées et les images, puis compilez :

```bash
nowly validate
nowly build example
```

Si Nowly n'est pas encore installé dans votre navigateur, intégrez la présence dans une extension de développement prête à l'emploi :

```bash
nowly extension example
nowly extension example --firefox
```

Chargez `dist/extension-dev` en version non empaquetée depuis `chrome://extensions` avec le **Mode développeur** activé, ou chargez `dist/extension-dev-firefox/manifest.json` comme module temporaire depuis `about:debugging` dans Firefox. Ouvrez le site visé : votre statut Discord doit changer.

Si vous utilisez déjà une version de développement non empaquetée de Nowly, itérez plus vite avec un zip :

```bash
nowly pack example
```

Déposez ensuite `dist/packs/example.zip` dans **Réglages**, **Avancé**, **Débogage** de l'extension. Les zips non signés ne sont acceptés que par les versions non empaquetées, jamais par la version de la boutique.

## La faire publier

1. Lancez `nowly validate` une dernière fois et testez la présence sur plusieurs vraies pages, y compris quand rien ne joue.
2. Ouvrez une pull request sur le dépôt des présences avec une courte description et une capture du statut Discord.
3. L'équipe relit le code, signe la version et la publie dans la bibliothèque. Dès lors, tout le monde peut l'installer en un clic, et vous apparaissez comme son auteur sur sa page de la bibliothèque.

## Aller plus loin

La documentation couvre toute l'API Presence, les réglages, la traduction, l'horodatage, les iframes et le proxy d'images pour les visuels que Discord ne peut pas charger directement. Commencez par [Créer votre première présence](https://docs.nowly.me/fr/presence-development/creating-your-first-presence) et gardez les [règles de contribution](https://docs.nowly.me/fr/publishing/contribution-guidelines) sous la main avant d'ouvrir votre pull request.
