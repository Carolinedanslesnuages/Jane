import { describe, expect, it } from 'vitest';
import { SPECIES, speciesLabel } from './species';

describe('species', () => {
  it('lists the four species of the API', () => {
    expect(SPECIES.map((entry) => entry.value)).toEqual(['DOG', 'CAT', 'HORSE', 'OTHER']);
  });

  it('gives a French label', () => {
    expect(speciesLabel('CAT')).toBe('Chat');
    expect(speciesLabel('OTHER')).toBe('Autre espèce');
  });
});
