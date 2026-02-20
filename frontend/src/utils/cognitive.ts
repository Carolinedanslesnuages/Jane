import type { CognitiveTestType } from '../api/types';

export const COGNITIVE_TESTS: { type: CognitiveTestType; label: string; description: string }[] = [
  {
    type: 'OBJECT_PERMANENCE',
    label: "Permanence de l'objet",
    description: 'Capacité à suivre une récompense cachée sous un gobelet (mémoire de travail).',
  },
  {
    type: 'DETOUR',
    label: 'Test du détour',
    description: 'Capacité à contourner une barrière transparente pour atteindre un objectif (résolution spatiale).',
  },
  {
    type: 'MANIPULATION',
    label: 'Test de manipulation',
    description: "Temps pour se libérer d'une couverture ou ouvrir un dispositif simple (persévérance).",
  },
];

export function cognitiveLabel(type: CognitiveTestType): string {
  return COGNITIVE_TESTS.find((test) => test.type === type)?.label ?? type;
}
