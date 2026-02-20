import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { BehaviorCategory, EthogramCategory } from '../api/types';

export const useEthogramStore = defineStore('ethogram', () => {
  const categories = ref<EthogramCategory[]>([]);

  const labelsByCategory = computed(
    () => Object.fromEntries(categories.value.map((entry) => [entry.category, entry.label])) as Record<BehaviorCategory, string>,
  );

  async function load() {
    if (categories.value.length === 0) {
      categories.value = await api.get<EthogramCategory[]>('/ethogram');
    }
  }

  function labelOf(category: BehaviorCategory): string {
    return labelsByCategory.value[category] ?? category;
  }

  return { categories, load, labelOf };
});
