import type { Species } from '../api/types';

export const SPECIES: { value: Species; label: string }[] = [
  { value: 'DOG', label: 'Chien' },
  { value: 'CAT', label: 'Chat' },
  { value: 'HORSE', label: 'Cheval' },
  { value: 'OTHER', label: 'Autre espèce' },
];

export function speciesLabel(species: Species): string {
  return SPECIES.find((entry) => entry.value === species)?.label ?? species;
}
