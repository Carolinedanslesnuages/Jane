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

/** The animals of one species, or all of them when no species is chosen. */
export function filterBySpecies<T extends { species: Species }>(animals: T[], species: Species | 'ALL'): T[] {
  return species === 'ALL' ? animals : animals.filter((animal) => animal.species === species);
}
