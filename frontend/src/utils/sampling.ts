import type { SamplingMethod } from '../api/types';

export const SAMPLING_METHODS: { value: SamplingMethod; label: string; description: string }[] = [
  { value: 'AD_LIBITUM', label: 'Libre', description: 'Tout ce qui se passe est noté, sans règle de sélection.' },
  { value: 'FOCAL', label: 'Focal', description: "Un animal est suivi en continu pendant la séance." },
  { value: 'SCAN', label: 'Scan', description: 'Relevés à intervalles réguliers (voir « Échantillonnage par intervalle »).' },
];

export function samplingLabel(method: SamplingMethod): string {
  return SAMPLING_METHODS.find((entry) => entry.value === method)?.label ?? method;
}
