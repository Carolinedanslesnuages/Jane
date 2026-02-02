import { BehaviorCategory } from '@prisma/client';

export interface EthogramCategory {
  category: BehaviorCategory;
  label: string;
  behaviors: string[];
}

/** The behaviours a user can record, grouped by category. Labels are shown as-is in the interface. */
export const ETHOGRAM: EthogramCategory[] = [
  {
    category: 'EXPLORATION',
    label: 'Exploration',
    behaviors: ['Flairer le sol', 'Flairer les objets', "Inspecter l'environnement", 'Chercher'],
  },
  {
    category: 'PLAY',
    label: 'Jeu',
    behaviors: ['Jouer avec jouet', 'Jouer avec humain', 'Jouer avec autre chien', 'Courir', 'Sauter'],
  },
  {
    category: 'REST',
    label: 'Repos',
    behaviors: ['Dormir', 'Se reposer', 'Somnoler', "S'allonger"],
  },
  {
    category: 'SOCIAL',
    label: 'Social',
    behaviors: ['Interaction humain', 'Interaction chien', "Demande d'attention", 'Lécher', 'Contact physique'],
  },
  {
    category: 'STRESS',
    label: 'Stress',
    behaviors: ['Aboyer', 'Gémir', 'Haleter excessif', 'Trembler', 'Se lécher les babines', 'Bâiller', 'Queue basse'],
  },
  {
    category: 'ELIMINATION',
    label: 'Élimination',
    behaviors: ['Uriner', 'Déféquer', 'Renifler avant élimination'],
  },
];

/** Returns the category of a behaviour, or undefined when it is not in the ethogram. */
export function findCategory(behavior: string): BehaviorCategory | undefined {
  return ETHOGRAM.find((entry) => entry.behaviors.includes(behavior))?.category;
}
