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

/** A behaviour with its definition: `['Dormir', 'Yeux fermés, ...']`. */
type BehaviorEntry = [name: string, definition: string];

/** Builds an ethogram from the behaviours of each category (labels are shown as-is in the interface). */
function defineEthogram(entries: Record<BehaviorCategory, BehaviorEntry[]>): EthogramCategory[] {
  return CATEGORY_ORDER.map((category) => {
    const names = entries[category].map(([name]) => name);
    return { category, label: CATEGORY_LABELS[category], behaviors: names, definitions: Object.fromEntries(entries[category]) };
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
  EXPLORATION: [
    ['Explorer une pièce', "Parcourt une pièce, museau et moustaches en avant, en s'arrêtant pour inspecter."],
    ['Flairer un objet', "Approche le museau d'un objet et le renifle."],
    ['Se percher en hauteur', "Monte sur un meuble ou un support élevé et s'y installe."],
    ['Observer par la fenêtre', "Assis ou couché face à une fenêtre, regard dirigé vers l'extérieur."],
  ],
  PLAY: [
    ['Chasser un jouet', "Se met à l'affût, fixe un jouet, puis s'élance et l'attrape."],
    ['Poursuivre', 'Court après un objet ou une personne en mouvement.'],
    ['Bondir', 'Saut brusque vers un objet, pattes antérieures tendues.'],
    ['Jouer avec un humain', "Attaque ou poursuit un jouet que la personne anime, griffes rentrées."],
  ],
  REST: [
    ['Dormir', 'Yeux fermés, corps replié ou étalé, respiration lente.'],
    ['Se reposer', 'Couché, éveillé, yeux ouverts ou mi-clos, immobile.'],
    ['Somnoler', 'Yeux mi-clos, oreilles encore mobiles.'],
    ['Se toiletter', 'Se lèche le pelage, les pattes ou la face, ou se gratte.'],
  ],
  SOCIAL: [
    ['Ronronner', "Vibration sonore continue et régulière, perçue à l'oreille ou au toucher."],
    ['Pétrir', "Alterne les pattes antérieures contre une surface ou une personne, parfois griffes sorties."],
    ["Se frotter contre quelqu'un", 'Frotte la tête, les joues ou le flanc contre une personne ou un congénère.'],
    ["Demander de l'attention", 'Miaule, suit ou se place devant la personne pour la solliciter.'],
    ['Toiletter un congénère', "Lèche le pelage d'un autre animal."],
  ],
  STRESS: [
    ['Se cacher', 'Se réfugie dans un lieu fermé ou sous un meuble et y reste.'],
    ['Oreilles plaquées', 'Les oreilles sont couchées vers l\'arrière ou sur les côtés de la tête.'],
    ['Queue gonflée', 'Les poils de la queue sont hérissés : elle paraît épaissie.'],
    ['Feuler', 'Émet un souffle bruyant, bouche ouverte.'],
    ['Miauler de façon répétée', 'Miaulements répétés, souvent plaintifs, sans cause évidente.'],
    ['Pupilles dilatées', 'Pupilles très larges alors que la lumière est normale.'],
  ],
  ELIMINATION: [
    ['Utiliser la litière', 'Urine ou défèque dans le bac prévu.'],
    ['Uriner hors de la litière', 'Urine en dehors du bac, en position accroupie.'],
    ['Marquer en urinant', "Debout, queue dressée et frémissante, projette de l'urine sur une surface verticale."],
    ['Gratter la litière', "Gratte la litière avant ou après l'élimination."],
  ],
});

const HORSE_ETHOGRAM = defineEthogram({
  EXPLORATION: [
    ['Flairer', "Le museau approche un objet, le sol ou un congénère, narines actives."],
    ["Inspecter l'environnement", 'Tête haute, oreilles orientées vers une source, regard fixe.'],
    ['Brouter', "Prélève de l'herbe ou du fourrage avec les lèvres et les dents, tête basse."],
    ['Gratter le sol du sabot', 'Racle le sol avec un antérieur, sans autre signe de tension.'],
  ],
  PLAY: [
    ['Galoper librement', 'Galop en liberté, sans cavalier, souvent queue relevée.'],
    ['Ruer en jeu', 'Détend les postérieurs en bondissant, sans cible.'],
    ['Jouer avec un congénère', 'Poursuite, morsures retenues, cabrage, rôles qui alternent.'],
    ['Se rouler', 'Se couche et se roule sur le dos ou le flanc, jambes en l\'air.'],
  ],
  REST: [
    ['Dormir debout', 'Debout, tête basse, un postérieur relâché, yeux fermés ou mi-clos.'],
    ['Dormir couché', 'Couché sur le flanc ou en sphinx, yeux fermés.'],
    ['Somnoler', 'Debout, paupières tombantes, lèvre inférieure relâchée.'],
    ['Se reposer', 'Immobile, éveillé, détendu.'],
  ],
  SOCIAL: [
    ['Se toiletter mutuellement', "Deux chevaux se grattent mutuellement l'encolure ou le garrot avec les lèvres."],
    ["Se tenir près d'un congénère", "Reste à moins d'une longueur de corps d'un congénère."],
    ['Interaction humain', 'Approche, flaire ou suit une personne, ou répond à son contact.'],
    ['Hennir', 'Émet un hennissement.'],
  ],
  STRESS: [
    ['Piaffer', 'Frappe le sol sur place avec un antérieur, de façon répétée.'],
    ['Secouer la tête', 'Mouvements brusques et répétés de la tête, sans insecte ni gêne apparente.'],
    ['Fouetter de la queue', 'Mouvements vifs de la queue, hors présence de mouches.'],
    ['Oreilles plaquées', "Oreilles couchées en arrière, collées contre l'encolure."],
    ["Montrer le blanc de l'œil", "Le blanc de l'œil est visible autour de l'iris."],
    ['Tic', "Comportement répétitif stéréotypé (tic à l'appui, tic de l'ours, tic à l'air)."],
    ['Trembler', 'Frissons musculaires visibles en dehors du froid.'],
  ],
  ELIMINATION: [
    ['Uriner', 'Écarte les postérieurs, queue relevée, urine.'],
    ['Déféquer', 'Queue relevée, émet des crottins.'],
  ],
});

/** A neutral ethogram for any other species (rabbit, bird, rodent, wildlife…). */
const GENERIC_ETHOGRAM = defineEthogram({
  EXPLORATION: [
    ['Explorer', "Se déplace en inspectant l'espace, museau ou tête en mouvement."],
    ['Flairer', 'Approche le museau ou le bec du sol ou d\'un objet pour le sentir.'],
    ['Chercher de la nourriture', 'Fouille, gratte ou prélève pour trouver à manger.'],
    ['Observer', "Reste immobile, tête orientée vers un point d'intérêt."],
  ],
  PLAY: [
    ['Jouer', 'Activité sans but apparent : mouvements exagérés, rôles alternés.'],
    ['Courir', 'Déplacement rapide, hors fuite.'],
    ['Sauter', 'Bondit ou enchaîne des sauts.'],
    ['Grimper', 'Monte sur un support, une paroi ou un perchoir.'],
  ],
  REST: [
    ['Dormir', 'Yeux fermés, immobile, respiration lente.'],
    ['Se reposer', 'Immobile et éveillé.'],
    ['Somnoler', 'Sommeil léger, yeux mi-clos.'],
  ],
  SOCIAL: [
    ['Interagir avec un congénère', 'Approche, contact ou échange avec un autre animal.'],
    ['Interagir avec un humain', 'Approche, contact ou réponse à une personne.'],
    ['Se toiletter', 'Entretient son pelage, ses plumes ou sa peau (léchage, lissage, bain de poussière).'],
    ['Vocaliser', 'Émet un cri, un chant ou un son.'],
  ],
  STRESS: [
    ['Fuir', 'S\'éloigne vite d\'un stimulus.'],
    ['Se cacher', 'Se réfugie hors de vue.'],
    ['Se figer', 'Interrompt tout mouvement, tendu, face à un stimulus.'],
    ['Vocalisation de détresse', 'Cris aigus ou répétés en situation d\'inconfort.'],
    ['Comportement répétitif', 'Mouvement stéréotypé répété, sans fonction apparente.'],
  ],
  ELIMINATION: [
    ['Uriner', "Émet de l'urine."],
    ['Déféquer', 'Émet des selles.'],
  ],
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
