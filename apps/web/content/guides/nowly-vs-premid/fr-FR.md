---
title: "Nowly ou PreMiD : une comparaison honnête"
description: Les deux affichent l'activité de sites web sur Discord. Voici comment ils se comparent sur l'installation, le catalogue, la vie privée, la sécurité et la licence, et comment choisir selon les plateformes que vous utilisez.
category: discord
order: 3
updated: 2026-10-07
related: discord-connections-vs-nowly, what-nowly-can-see, set-up-nowly
---

Si vous cherchez à afficher sur Discord ce que vous regardez dans votre navigateur, deux noms reviennent vite : PreMiD, le projet communautaire historique, et Nowly, une alternative plus récente. Ils règlent le même problème avec la même architecture de base, donc le bon choix se joue sur les détails. Cette comparaison se veut juste, y compris là où PreMiD a l'avantage.

Les deux projets évoluent vite. Les faits ci-dessous les décrivent au moment de l'écriture ; consultez le site de chaque projet pour la situation actuelle.

## Ce qu'ils ont en commun

- **La même architecture.** Une extension lit la page, et une petite application sur votre ordinateur transmet l'activité à l'application Discord par sa connexion locale. Aucun des deux ne marche avec Discord dans un onglet ou sur un téléphone.
- **Des intégrations par site.** Les deux les appellent des présences : un script par plateforme, écrit par la communauté, qui sait quoi lire sur ce site.
- **Gratuits.** Aucun ne fait payer l'extension, l'application de bureau ou les présences.

## Là où PreMiD a l'avantage

- **La taille du catalogue.** PreMiD existe depuis des années et sa communauté a écrit des présences pour des centaines de sites, y compris beaucoup de sites de niche. La bibliothèque de Nowly compte aujourd'hui plus de 40 plateformes, centrées sur les plus utilisées.
- **La maturité et la communauté.** Des années d'utilisation, c'est beaucoup de cas particuliers rencontrés et corrigés, et une grande communauté d'auteurs de présences.

Si la plateforme qui vous intéresse n'existe que dans le catalogue de PreMiD, PreMiD est tout simplement le meilleur choix pour vous.

## Ce sur quoi Nowly se concentre

- **Des présences signées.** Chaque présence officielle de Nowly est signée par l'équipe avec une clé ECDSA P-256, et l'extension vérifie la signature et les empreintes avant de l'exécuter. Un script modifié est refusé.
- **La vie privée par défaut.** L'activité de navigation est désactivée par défaut sur la plupart des présences, plusieurs ont un mode privé, les discussions temporaires de ChatGPT restent masquées, et les statistiques d'utilisation sont coupées tant que vous ne les activez pas. Voir [Ce que Nowly peut voir](/guides/what-nowly-can-see).
- **Le contrôle au quotidien.** Un raccourci de pause générale, des onglets masqués, la mise en veille d'une présence pour quelques heures, et des horaires par présence. Voir [Choisir exactement ce que Discord affiche de vous](/guides/control-what-discord-shows).
- **Un diagnostic intégré.** Le panneau latéral vérifie chaque maillon séparément (extension, scripts utilisateur, application de bureau, Discord, présence, activité), pour savoir lequel corriger.
- **Panneau latéral et langues.** L'extension vit dans le panneau latéral du navigateur, et l'interface comme le site existent en 11 langues.
- **Une application de bureau pour Windows, macOS et Linux**, avec un paquet `.deb` et une archive pour les autres distributions.
- **Une synchronisation facultative.** Connectez-vous avec Discord seulement si vous voulez retrouver vos présences et réglages sur plusieurs navigateurs.

## La licence

Le code de PreMiD est open source. Les présences de Nowly sont open source sous licence MIT, et son SDK et son CLI sont documentés pour les contributeurs. Le code principal de Nowly est public sur GitHub sous Business Source License 1.1, une licence « source disponible » : vous pouvez le lire et l'auditer, mais ce n'est pas une licence open source approuvée par l'OSI. Si cette distinction compte pour vous, elle est bonne à connaître.

## Lequel choisir ?

- **Votre plateforme n'existe que sur PreMiD** : prenez PreMiD.
- **Vos plateformes existent sur les deux** : essayez Nowly si les présences signées, la confidentialité par défaut et le contrôle fin comptent pour vous ; restez sur PreMiD si vous en êtes content.
- **Vous voulez les deux pour des plateformes différentes** : c'est possible, mais prudence. Deux outils qui modifient votre activité Discord en même temps peuvent remplacer ou effacer le statut de l'autre. Assurez-vous que chaque plateforme n'est gérée que par l'un des deux, et coupez l'autre pendant vos tests.

## Passer de PreMiD à Nowly

1. Quittez l'application de bureau de PreMiD et désactivez son extension, pour qu'elle arrête de modifier votre activité.
2. Suivez [Installer Nowly](/guides/set-up-nowly) : extension, scripts utilisateur, application de bureau, Discord.
3. Installez depuis la [bibliothèque](/library) les présences qui remplacent celles que vous utilisiez.
4. Vérifiez le diagnostic dans le panneau latéral, puis votre profil Discord.

S'il manque dans la bibliothèque une plateforme que vous utilisiez sur PreMiD, demandez-la depuis la [page d'aide](/support) : de nouvelles présences arrivent régulièrement, et chacun peut en écrire une avec le [guide développeur](/guides/create-your-first-presence).
