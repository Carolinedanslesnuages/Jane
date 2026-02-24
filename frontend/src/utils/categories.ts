import type { BehaviorCategory } from '../api/types';

/** The six categories are the same for every species. */
export const CATEGORY_LABELS: Record<BehaviorCategory, string> = {
  EXPLORATION: 'Exploration',
  PLAY: 'Jeu',
  REST: 'Repos',
  SOCIAL: 'Social',
  STRESS: 'Stress',
  ELIMINATION: 'Élimination',
};

export function categoryLabel(category: BehaviorCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** The CSS colour variable of a behaviour category. */
export function categoryColor(category: BehaviorCategory): string {
  return `var(--category-${category.toLowerCase()})`;
}
