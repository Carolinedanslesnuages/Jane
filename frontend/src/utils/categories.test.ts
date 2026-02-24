import { describe, expect, it } from 'vitest';
import { categoryColor, categoryLabel, CATEGORY_LABELS } from './categories';

describe('categories', () => {
  it('labels the six categories in French', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6);
    expect(categoryLabel('PLAY')).toBe('Jeu');
    expect(categoryLabel('ELIMINATION')).toBe('Élimination');
  });

  it('points to the colour variable of the stylesheet', () => {
    expect(categoryColor('STRESS')).toBe('var(--category-stress)');
  });
});
