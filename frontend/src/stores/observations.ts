import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { ActiveState, Observation, ObservationContext } from '../api/types';

const RECENT_COUNT = 10;
const HISTORY_LIMIT = 500;

export const useObservationsStore = defineStore('observations', () => {
  const activeStates = ref<ActiveState[]>([]);
  const recent = ref<Observation[]>([]);
  const history = ref<Observation[]>([]);
  const historyTotal = ref(0);

  /** Reloads the running states and the latest observations of a animal. */
  async function refresh(animalId: string) {
    const [states, latest] = await Promise.all([
      api.get<ActiveState[]>(`/animals/${animalId}/active-states`),
      api.get<{ items: Observation[] }>(`/observations?animalId=${animalId}&limit=${RECENT_COUNT}`),
    ]);
    activeStates.value = states;
    recent.value = latest.items;
  }

  async function recordEvent(animalId: string, behavior: string, context: ObservationContext) {
    await api.post(`/animals/${animalId}/events`, { behavior, ...context });
    await refresh(animalId);
  }

  async function startState(animalId: string, behavior: string) {
    await api.post(`/animals/${animalId}/states/start`, { behavior });
    await refresh(animalId);
  }

  async function stopState(animalId: string, behavior: string, context: ObservationContext) {
    await api.post(`/animals/${animalId}/states/stop`, { behavior, ...context });
    await refresh(animalId);
  }

  function isRunning(behavior: string): boolean {
    return activeStates.value.some((state) => state.behavior === behavior);
  }

  /** The full list of a animal's observations (newest first, up to HISTORY_LIMIT). */
  async function loadHistory(animalId: string) {
    const page = await api.get<{ total: number; items: Observation[] }>(`/observations?animalId=${animalId}&limit=${HISTORY_LIMIT}`);
    history.value = page.items;
    historyTotal.value = page.total;
  }

  async function removeObservation(animalId: string, observationId: string) {
    await api.delete(`/observations/${observationId}`);
    await loadHistory(animalId);
  }

  function reset() {
    activeStates.value = [];
    recent.value = [];
    history.value = [];
    historyTotal.value = 0;
  }

  return { activeStates, recent, history, historyTotal, loadHistory, removeObservation, refresh, recordEvent, startState, stopState, isRunning, reset };
});
