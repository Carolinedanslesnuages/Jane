# Ajouter une espèce

Jane propose un éthogramme par espèce : les six catégories (exploration, jeu, repos, social, stress, élimination) sont
communes, mais les comportements qu'elles contiennent changent. Chien, chat, cheval et « autre espèce » existent déjà.

Pour ajouter une espèce, par exemple le lapin :

1. **Schéma** : ajouter la valeur à l'énumération `Species` dans `backend/prisma/schema.prisma`, puis créer la migration
   (`npx prisma migrate dev --name add_rabbit_species`).
2. **Éthogramme** : dans `backend/src/ethogram/ethogram.ts`, écrire `RABBIT_ETHOGRAM` avec `defineEthogram({...})` (pour chaque
   catégorie, une liste de paires `['Comportement', 'Définition observable']`) et l'ajouter à `ETHOGRAMS`. Le compilateur refuse de continuer tant que l'espèce n'a pas
   d'éthogramme.
3. **Libellé** : ajouter son nom français dans `SPECIES_LABELS` (`backend/src/animals/species.ts`) et dans `SPECIES`
   (`frontend/src/utils/species.ts`).
4. **Tests** : les tests existants vérifient déjà, pour chaque espèce, que toutes les catégories sont présentes une seule fois
   et qu'aucun comportement n'est listé deux fois. Ajouter un test sur un comportement propre à l'espèce.

## Règles pour écrire un éthogramme

- Un comportement appartient à **une seule** catégorie pour une espèce donnée ; le même mot peut exister dans plusieurs
  espèces (« Dormir »).
- Le libellé est affiché tel quel dans l'interface et enregistré tel quel : modifier un libellé existant ne met pas à jour les
  anciennes observations.
- Décrire des comportements observables (« Oreilles plaquées »), pas des interprétations (« Il a peur »). La définition dit ce
  qu'on doit voir ou entendre pour noter le comportement : elle s'affiche en infobulle et peut être montrée à l'écran pour
  former un second observateur. Chaque comportement doit en avoir une (les tests le vérifient).
- Faire relire la liste par une personne du métier (éthologue, vétérinaire comportementaliste) avant de s'en servir pour une
  étude : les listes fournies sont un point de départ, pas un éthogramme validé scientifiquement.
