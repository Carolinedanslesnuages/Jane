import { BehaviorCategory, Species } from '@prisma/client';

export interface EthogramCategory {
  category: BehaviorCategory;
  label: string;
  behaviors: string[];
}

/** The six categories are shared by every species; only the behaviours inside them differ. */
export const CATEGORY_LABELS: Record<BehaviorCategory, string> = {
  EXPLORATION: 'Exploration',
  PLAY: 'Jeu',
  REST: 'Repos',
  SOCIAL: 'Social',
  STRESS: 'Stress',
  ELIMINATION: 'Élimination',
};

const CATEGORY_ORDER: BehaviorCategory[] = ['EXPLORATION', 'PLAY', 'REST', 'SOCIAL', 'STRESS', 'ELIMINATION'];

/** Builds an ethogram from the behaviours of each category (labels are shown as-is in the interface). */
function defineEthogram(behaviors: Record<BehaviorCategory, string[]>): EthogramCategory[] {
  return CATEGORY_ORDER.map((category) => ({ category, label: CATEGORY_LABELS[category], behaviors: behaviors[category] }));
}

const DOG_ETHOGRAM = defineEthogram({
  EXPLORATION: ['Flairer le sol', 'Flairer les objets', "Inspecter l'environnement", 'Chercher'],
  PLAY: ['Jouer avec jouet', 'Jouer avec humain', 'Jouer avec autre chien', 'Courir', 'Sauter'],
  REST: ['Dormir', 'Se reposer', 'Somnoler', "S'allonger"],
  SOCIAL: ['Interaction humain', 'Interaction chien', "Demande d'attention", 'Lécher', 'Contact physique'],
  STRESS: ['Aboyer', 'Gémir', 'Haleter excessif', 'Trembler', 'Se lécher les babines', 'Bâiller', 'Queue basse'],
  ELIMINATION: ['Uriner', 'Déféquer', 'Renifler avant élimination'],
});

/** The ethograms available so far; a species without its own one falls back to the dog's. */
const ETHOGRAMS: Partial<Record<Species, EthogramCategory[]>> = {
  DOG: DOG_ETHOGRAM,
};

export function ethogramFor(species: Species): EthogramCategory[] {
  return ETHOGRAMS[species] ?? DOG_ETHOGRAM;
}

/** Returns the category of a behaviour for a species, or undefined when it is not in its ethogram. */
export function findCategory(species: Species, behavior: string): BehaviorCategory | undefined {
  return ethogramFor(species).find((entry) => entry.behaviors.includes(behavior))?.category;
}
