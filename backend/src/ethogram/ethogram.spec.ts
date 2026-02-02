import { BehaviorCategory } from '@prisma/client';
import { ETHOGRAM, findCategory } from './ethogram';

describe('ethogram', () => {
  it('covers every category of the database enum exactly once', () => {
    const categories = ETHOGRAM.map((entry) => entry.category).sort();
    expect(categories).toEqual(Object.values(BehaviorCategory).sort());
  });

  it('has no behaviour listed twice', () => {
    const behaviors = ETHOGRAM.flatMap((entry) => entry.behaviors);
    expect(new Set(behaviors).size).toBe(behaviors.length);
  });

  it('finds the category of a behaviour', () => {
    expect(findCategory('Aboyer')).toBe('STRESS');
    expect(findCategory('Dormir')).toBe('REST');
    expect(findCategory('Voler')).toBeUndefined();
  });
});
