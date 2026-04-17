# Guide de l'observateur

Ce guide explique comment utiliser Jane sur le terrain. Il ne demande aucune connaissance technique.

## 1. Commencer

1. **Connexion** : créez votre compte depuis la page de connexion (« Enregistrement »), puis connectez-vous.
2. **Profils** : ajoutez les animaux que vous suivez (nom, espèce, date de naissance si vous la connaissez). L'espèce choisit
   la liste des comportements proposés.
3. **Animal suivi** : le sélecteur en haut de la barre latérale indique l'animal sur lequel portent les pages Observation,
   Tests cognitifs, Tableau de bord et Données.

## 2. Observer

Sur la page **Observation**, choisissez le mode :

- **Événement** : un clic note un comportement instantané (un aboiement, un coup de sabot).
- **État** : « Démarrer » puis « Arrêter » mesure la durée d'un comportement (un sommeil, une phase de jeu). Plusieurs états
  peuvent courir à la fois ; la carte « En cours » les montre avec leur chronomètre.

Pour savoir quoi noter, **survolez un bouton** : sa définition s'affiche ; cochez « Afficher les définitions » pour les lire
à l'écran. Une définition décrit ce qu'on doit voir ou entendre, pas une interprétation.

La carte **Contexte** (lieu, météo, stimuli, notes) s'ajoute à chaque saisie. **Noter après coup** permet de saisir un
comportement ou un état déjà terminé, avec son heure (jamais dans le futur).

## 3. Séances

Une **séance** regroupe ce que vous observez pendant un moment : qui observe, avec quelle méthode (libre, focal, scan), de
quand à quand. Démarrez-la depuis la carte « Séance » et terminez-la en fin d'observation ; les états encore en cours
s'arrêtent alors d'eux-mêmes. Les séances et leur nombre d'observations sont listés dans la page **Données**.

L'**échantillonnage par intervalle** (« scan ») est un minuteur qui vous rappelle de relever, toutes les 2 à 30 minutes, ce que
fait l'animal à cet instant.

## 4. Sans réseau

Installez Jane depuis le navigateur (« Installer l'application ») : elle s'ouvre ensuite comme une application.

- Si le réseau disparaît, un bandeau « Hors ligne » apparaît. **Continuez à saisir** : les observations, les états démarrés et
  arrêtés et les tests cognitifs restent sur l'appareil, avec leur vraie heure, et la liste « saisies en attente d'envoi » les
  montre dans la barre latérale.
- Au retour du réseau, tout part automatiquement (vous pouvez aussi cliquer sur « Envoyer maintenant »).
- Si vous ouvrez Jane sans réseau, elle s'ouvre avec les animaux connus de l'appareil et se reconnecte seule au retour du réseau.

À savoir : la **première** connexion demande du réseau ; ajouter, modifier ou supprimer un animal, démarrer ou terminer une
séance et partager demandent aussi du réseau. Ne vous déconnectez pas tant qu'il reste des saisies en attente.

## 5. Tests cognitifs

La page **Tests cognitifs** propose trois épreuves (permanence de l'objet, détour, manipulation) avec un chronomètre au dixième
de seconde, un score facultatif de 0 à 10 et un historique que l'on peut corriger.

## 6. Partager un animal

Dans **Profils**, « Partager » invite un autre compte Jane, par son adresse e-mail (la personne doit s'être connectée une
fois). Deux droits :

- **Observateur** : consulte et saisit (observations, séances, tests) ; son nom est conservé sur chaque saisie.
- **Lecteur** : consulte seulement, y compris les statistiques et les exports.

Vous pouvez changer les droits ou retirer l'accès à tout moment. Une personne peut aussi quitter un partage.

## 7. Analyser et exporter

Le **Tableau de bord** montre, sur la période choisie, le budget-temps, l'évolution du stress et son contexte, et l'activité
quotidienne. La page **Données** exporte en CSV (lisible avec R ou un tableur ; il indique l'espèce, la séance, l'observateur
et l'auteur de chaque saisie) et produit un rapport PDF des 30 derniers jours.

## 8. Vos données

La page **Mon compte** permet d'exporter toutes vos données puis de supprimer votre compte, ce qui supprime aussi vos animaux,
leurs observations et leurs tests. **C'est définitif.**
