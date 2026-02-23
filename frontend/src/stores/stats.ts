import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { StatsSummary } from '../api/types';
import { endOfLocalDay, startOfLocalDay } from '../utils/period';

export const useStatsStore = defineStore('stats', () => {
  const summary = ref<StatsSummary | null>(null);
  const loading = ref(false);

  /** Loads the statistics of a animal between two local dates (AAAA-MM-JJ, both included). */
  async function load(animalId: string, fromDate: string, toDate: string) {
    loading.value = true;
    try {
      const query = new URLSearchParams({
        animalId,
        from: startOfLocalDay(fromDate),
        to: endOfLocalDay(toDate),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      summary.value = await api.get<StatsSummary>(`/stats/summary?${query}`);
    } finally {
      loading.value = false;
    }
  }

  return { summary, loading, load };
});
