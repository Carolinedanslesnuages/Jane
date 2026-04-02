import { BehaviorCategory, Species } from '@prisma/client';

export interface EthogramCategory {
  category: BehaviorCategory;
  label: string;
  behaviors: string[];
  /** What to look for to record each behaviour: observable criteria, not interpretations. */
  definitions: Record<string, string>;
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

/** A behaviour, alone or with its definition: `['Dormir', 'Yeux fermés, ...']`. */
type BehaviorEntry = string | [name: string, definition: string];

/** Builds an ethogram from the behaviours of each category (labels are shown as-is in the interface). */
function defineEthogram(entries: Record<BehaviorCategory, BehaviorEntry[]>): EthogramCategory[] {
  return CATEGORY_ORDER.map((category) => {
    const names = entries[category].map((entry) => (typeof entry === 'string' ? entry : entry[0]));
    const definitions = Object.fromEntries(entries[category].filter((entry): entry is [string, string] => typeof entry !== 'string'));
    return { category, label: CATEGORY_LABELS[category], behaviors: names, definitions };
  });
}

const DOG_ETHOGRAM = defineEthogram({
  EXPLORATION: [
    ['Flairer le sol', "Le museau est près du sol, les narines s'activent, la tête suit une piste."],
    ['Flairer les objets', 'Le museau touche ou approche un objet en reniflant.'],
    ["Inspecter l'environnement", "La tête se tourne et le regard balaie les lieux, l'animal est immobile ou se déplace lentement."],
    ['Chercher', "Se déplace en explorant activement pour trouver quelque chose (nourriture, jouet)."],
  ],
  PLAY: [
    ['Jouer avec jouet', 'Saisit, secoue, lance ou poursuit un objet de manière ludique.'],
    ['Jouer avec humain', "Sollicite ou répond à un jeu avec une personne (poursuite, tirer, révérence de jeu)."],
    ['Jouer avec autre chien', 'Jeu avec un congénère : poursuite, lutte souple, rôles qui alternent.'],
    ['Courir', 'Déplacement rapide, galop ou trot soutenu, sans autre but visible.'],
    ['Sauter', "Bondit : les quatre pattes quittent le sol ou les antérieures se lèvent."],
  ],
  REST: [
    ['Dormir', 'Yeux fermés, corps relâché, respiration lente et régulière, peu de réaction aux bruits légers.'],
    ['Se reposer', 'Couché ou assis, calme, yeux ouverts, tête posée ou relevée.'],
    ['Somnoler', "Yeux mi-clos ou qui s'ouvrent par moments, oreilles encore mobiles : sommeil léger."],
    ["S'allonger", 'Passe de la position debout ou assise à couchée (le geste, pas la durée).'],
  ],
  SOCIAL: [
    ['Interaction humain', "Échange avec une personne : regard, contact, réponse à un appel ou à un geste."],
    ['Interaction chien', 'Échange avec un congénère : approche, flairage, postures, hors jeu.'],
    ["Demande d'attention", "Se place près de la personne et la sollicite (patte, museau, regard insistant, gémissement doux)."],
    ['Lécher', 'Passe la langue sur une personne, un congénère ou un objet.'],
    ['Contact physique', 'Corps appuyé contre une personne ou un congénère, contact prolongé.'],
  ],
  STRESS: [
    ['Aboyer', "Émet un ou plusieurs aboiements."],
    ['Gémir', 'Émet un son aigu, plaintif et prolongé.'],
    ['Haleter excessif', "Halètement hors de proportion avec l'effort ou la chaleur, langue sortie, bouche tendue."],
    ['Trembler', 'Tremblements du corps ou des membres en dehors du froid.'],
    ['Se lécher les babines', 'La langue passe rapidement sur le museau, hors repas.'],
    ['Bâiller', 'Ouverture large et prolongée de la gueule, sans fatigue apparente.'],
    ['Queue basse', 'La queue est tenue basse ou rentrée entre les postérieurs.'],
  ],
  ELIMINATION: [
    ['Uriner', "Émission d'urine, accroupi ou patte levée."],
    ['Déféquer', 'Émission de selles, dos arrondi.'],
    ['Renifler avant élimination', "Flaire et tourne en cercle avant d'uriner ou de déféquer."],
  ],
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
