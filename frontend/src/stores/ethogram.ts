import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import { loadWithCache } from '../offline/cache';
import type { EthogramCategory, Species } from '../api/types';

export const useEthogramStore = defineStore('ethogram', () => {
  const bySpecies = ref<Partial<Record<Species, EthogramCategory[]>>>({});

  /** Loads the ethogram of a species once; later calls reuse it. */
  async function load(species: Species) {
    if (!bySpecies.value[species]) {
      const { value } = await loadWithCache(`ethogram:${species}`, () => api.get<EthogramCategory[]>(`/ethogram?species=${species}`));
      bySpecies.value[species] = value;
    }
  }

  function categoriesFor(species: Species): EthogramCategory[] {
    return bySpecies.value[species] ?? [];
  }

  return { bySpecies, load, categoriesFor };
});
