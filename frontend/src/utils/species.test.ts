import { describe, expect, it } from 'vitest';
import { filterBySpecies, SPECIES, speciesLabel } from './species';

describe('species', () => {
  it('lists the four species of the API', () => {
    expect(SPECIES.map((entry) => entry.value)).toEqual(['DOG', 'CAT', 'HORSE', 'OTHER']);
  });

  it('gives a French label', () => {
    expect(speciesLabel('CAT')).toBe('Chat');
    expect(speciesLabel('OTHER')).toBe('Autre espèce');
  });

  it('filters animals by species', () => {
    const animals = [
      { name: 'Rex', species: 'DOG' as const },
      { name: 'Mistigri', species: 'CAT' as const },
      { name: 'Luna', species: 'DOG' as const },
    ];
    expect(filterBySpecies(animals, 'DOG').map((animal) => animal.name)).toEqual(['Rex', 'Luna']);
    expect(filterBySpecies(animals, 'HORSE')).toEqual([]);
    expect(filterBySpecies(animals, 'ALL')).toHaveLength(3);
  });
});
