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

const CAT_ETHOGRAM = defineEthogram({
  EXPLORATION: ['Explorer une pièce', 'Flairer un objet', 'Se percher en hauteur', 'Observer par la fenêtre'],
  PLAY: ['Chasser un jouet', 'Poursuivre', 'Bondir', 'Jouer avec un humain'],
  REST: ['Dormir', 'Se reposer', 'Somnoler', 'Se toiletter'],
  SOCIAL: ['Ronronner', 'Pétrir', "Se frotter contre quelqu'un", "Demander de l'attention", 'Toiletter un congénère'],
  STRESS: ['Se cacher', 'Oreilles plaquées', 'Queue gonflée', 'Feuler', 'Miauler de façon répétée', 'Pupilles dilatées'],
  ELIMINATION: ['Utiliser la litière', 'Uriner hors de la litière', 'Marquer en urinant', 'Gratter la litière'],
});

const HORSE_ETHOGRAM = defineEthogram({
  EXPLORATION: ['Flairer', "Inspecter l'environnement", 'Brouter', 'Gratter le sol du sabot'],
  PLAY: ['Galoper librement', 'Ruer en jeu', 'Jouer avec un congénère', 'Se rouler'],
  REST: ['Dormir debout', 'Dormir couché', 'Somnoler', 'Se reposer'],
  SOCIAL: ['Se toiletter mutuellement', "Se tenir près d'un congénère", 'Interaction humain', 'Hennir'],
  STRESS: ['Piaffer', 'Secouer la tête', 'Fouetter de la queue', 'Oreilles plaquées', 'Montrer le blanc de l\'œil', 'Tic', 'Trembler'],
  ELIMINATION: ['Uriner', 'Déféquer'],
});

/** A neutral ethogram for any other species (rabbit, bird, rodent, wildlife…). */
const GENERIC_ETHOGRAM = defineEthogram({
  EXPLORATION: ['Explorer', 'Flairer', 'Chercher de la nourriture', 'Observer'],
  PLAY: ['Jouer', 'Courir', 'Sauter', 'Grimper'],
  REST: ['Dormir', 'Se reposer', 'Somnoler'],
  SOCIAL: ['Interagir avec un congénère', 'Interagir avec un humain', 'Se toiletter', 'Vocaliser'],
  STRESS: ['Fuir', 'Se cacher', 'Se figer', 'Vocalisation de détresse', 'Comportement répétitif'],
  ELIMINATION: ['Uriner', 'Déféquer'],
});

/** The ethogram of every species. */
const ETHOGRAMS: Record<Species, EthogramCategory[]> = {
  DOG: DOG_ETHOGRAM,
  CAT: CAT_ETHOGRAM,
  HORSE: HORSE_ETHOGRAM,
  OTHER: GENERIC_ETHOGRAM,
};

export function ethogramFor(species: Species): EthogramCategory[] {
  return ETHOGRAMS[species];
}

/** Returns the category of a behaviour for a species, or undefined when it is not in its ethogram. */
export function findCategory(species: Species, behavior: string): BehaviorCategory | undefined {
  return ethogramFor(species).find((entry) => entry.behaviors.includes(behavior))?.category;
}
