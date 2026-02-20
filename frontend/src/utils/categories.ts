import type { BehaviorCategory } from '../api/types';

/** The CSS colour variable of a behaviour category. */
export function categoryColor(category: BehaviorCategory): string {
  return `var(--category-${category.toLowerCase()})`;
}
