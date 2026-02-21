import { BehaviorCategory, Species } from '@prisma/client';
import { CATEGORY_LABELS, ethogramFor, findCategory } from './ethogram';

const SPECIES = Object.values(Species);

describe('ethogram', () => {
  it.each(SPECIES)('covers every category of the database enum exactly once for %s', (species) => {
    const categories = ethogramFor(species).map((entry) => entry.category).sort();
    expect(categories).toEqual(Object.values(BehaviorCategory).sort());
  });

  it.each(SPECIES)('has no behaviour listed twice for %s', (species) => {
    const behaviors = ethogramFor(species).flatMap((entry) => entry.behaviors);
    expect(new Set(behaviors).size).toBe(behaviors.length);
  });

  it('gives a label to every category', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(Object.values(BehaviorCategory).sort());
  });

  it('finds the category of a behaviour', () => {
    expect(findCategory('DOG', 'Aboyer')).toBe('STRESS');
    expect(findCategory('DOG', 'Dormir')).toBe('REST');
    expect(findCategory('DOG', 'Voler')).toBeUndefined();
  });

  it('has behaviours that are specific to the cat', () => {
    expect(findCategory('CAT', 'Ronronner')).toBe('SOCIAL');
    expect(findCategory('CAT', 'Utiliser la litière')).toBe('ELIMINATION');
    expect(findCategory('CAT', 'Aboyer')).toBeUndefined();
    expect(findCategory('DOG', 'Ronronner')).toBeUndefined();
  });
});
