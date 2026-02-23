import { Species } from '@prisma/client';
import { SPECIES_LABELS } from './species';

describe('SPECIES_LABELS', () => {
  it('names every species of the database enum', () => {
    expect(Object.keys(SPECIES_LABELS).sort()).toEqual(Object.values(Species).sort());
  });
});
