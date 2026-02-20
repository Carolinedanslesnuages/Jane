import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { ActiveState, Observation, ObservationContext } from '../api/types';

const RECENT_COUNT = 10;

export const useObservationsStore = defineStore('observations', () => {
  const activeStates = ref<ActiveState[]>([]);
  const recent = ref<Observation[]>([]);

  /** Reloads the running states and the latest observations of a dog. */
  async function refresh(dogId: string) {
    const [states, latest] = await Promise.all([
      api.get<ActiveState[]>(`/dogs/${dogId}/active-states`),
      api.get<{ items: Observation[] }>(`/observations?dogId=${dogId}&limit=${RECENT_COUNT}`),
    ]);
    activeStates.value = states;
    recent.value = latest.items;
  }

  async function recordEvent(dogId: string, behavior: string, context: ObservationContext) {
    await api.post(`/dogs/${dogId}/events`, { behavior, ...context });
    await refresh(dogId);
  }

  async function startState(dogId: string, behavior: string) {
    await api.post(`/dogs/${dogId}/states/start`, { behavior });
    await refresh(dogId);
  }

  async function stopState(dogId: string, behavior: string, context: ObservationContext) {
    await api.post(`/dogs/${dogId}/states/stop`, { behavior, ...context });
    await refresh(dogId);
  }

  function isRunning(behavior: string): boolean {
    return activeStates.value.some((state) => state.behavior === behavior);
  }

  function reset() {
    activeStates.value = [];
    recent.value = [];
  }

  return { activeStates, recent, refresh, recordEvent, startState, stopState, isRunning, reset };
});
