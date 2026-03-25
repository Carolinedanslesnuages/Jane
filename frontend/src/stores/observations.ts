import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { ActiveState, BehaviorCategory, Observation, ObservationContext } from '../api/types';
import { NetworkError } from '../offline/outbox';
import { useConnectivityStore } from './connectivity';
import { useOutboxStore } from './outbox';

const RECENT_COUNT = 10;
const HISTORY_LIMIT = 500;

export const useObservationsStore = defineStore('observations', () => {
  const activeStates = ref<ActiveState[]>([]);
  /** The animal whose states are displayed (needed to merge in the ones waiting in the outbox). */
  const currentAnimalId = ref<string | null>(null);
  const recent = ref<Observation[]>([]);
  const history = ref<Observation[]>([]);
  const historyTotal = ref(0);

  /** Reloads the running states and the latest observations of an animal; offline, the last view is kept. */
  async function refresh(animalId: string) {
    currentAnimalId.value = animalId;
    try {
      const [states, latest] = await Promise.all([
        api.get<ActiveState[]>(`/animals/${animalId}/active-states`),
        api.get<{ items: Observation[] }>(`/observations?animalId=${animalId}&limit=${RECENT_COUNT}`),
      ]);
      activeStates.value = states;
      recent.value = latest.items;
    } catch (error) {
      if (!(error instanceof NetworkError)) {
        throw error;
      }
      useConnectivityStore().setOnline(false);
    }
  }

  /**
   * Records an event. Online it is sent at once; offline it waits in the outbox with the moment it was noted.
   * Returns whether it was "sent" or "queued".
   */
  async function recordEvent(animalId: string, behavior: string, context: ObservationContext, label = behavior) {
    const body = { behavior, ...context };
    const queuedBody = { ...body, occurredAt: context.occurredAt ?? new Date().toISOString() };
    const outcome = await useOutboxStore().submit(`/animals/${animalId}/events`, body, label, queuedBody);
    if (outcome === 'sent') {
      await refresh(animalId);
    }
    return outcome;
  }

  /** Records a state that is already over, with its start and end (ISO instants). */
  async function logState(
    animalId: string,
    behavior: string,
    startedAt: string,
    endedAt: string,
    context: ObservationContext,
    label = behavior,
  ) {
    const body = { behavior, startedAt, endedAt, ...context };
    const outcome = await useOutboxStore().submit(`/animals/${animalId}/states/log`, body, label);
    if (outcome === 'sent') {
      await refresh(animalId);
    }
    return outcome;
  }

  /**
   * The states running for the current animal: those known to the server plus those started on this device and
   * not sent yet, minus those already stopped on this device.
   */
  const running = computed<ActiveState[]>(() => {
    const animalId = currentAnimalId.value;
    if (!animalId) {
      return [];
    }
    let states = [...activeStates.value];
    const prefix = `/animals/${animalId}/states/`;
    for (const entry of useOutboxStore().entries().filter((item) => item.path.startsWith(prefix))) {
      const body = entry.body as { behavior: string; startedAt?: string };
      if (entry.path.endsWith('/start')) {
        states.push({
          id: entry.id,
          animalId,
          behavior: body.behavior,
          category: (entry.meta?.category ?? 'REST') as BehaviorCategory,
          startedAt: body.startedAt ?? entry.createdAt,
          pending: true,
        });
      } else if (entry.path.endsWith('/stop')) {
        states = states.filter((state) => state.behavior !== body.behavior);
      }
    }
    return states;
  });

  /** Starts timing a behaviour (sent at once, or kept with its real start when there is no network). */
  async function startState(animalId: string, behavior: string, category: BehaviorCategory, label = behavior) {
    const queuedBody = { behavior, startedAt: new Date().toISOString() };
    const outcome = await useOutboxStore().submit(`/animals/${animalId}/states/start`, { behavior }, label, queuedBody, { category });
    if (outcome === 'sent') {
      await refresh(animalId);
    }
    return outcome;
  }

  /** Stops a running behaviour (sent at once, or kept with its real end when there is no network). */
  async function stopState(animalId: string, behavior: string, context: ObservationContext, label = behavior) {
    const body = { behavior, ...context };
    const queuedBody = { ...body, endedAt: new Date().toISOString() };
    const outcome = await useOutboxStore().submit(`/animals/${animalId}/states/stop`, body, label, queuedBody);
    if (outcome === 'sent') {
      await refresh(animalId);
    }
    return outcome;
  }

  function isRunning(behavior: string): boolean {
    return running.value.some((state) => state.behavior === behavior);
  }

  /** The full list of an animal's observations (newest first, up to HISTORY_LIMIT). */
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
    currentAnimalId.value = null;
    recent.value = [];
    history.value = [];
    historyTotal.value = 0;
  }

  return { activeStates, running, recent, history, historyTotal, loadHistory, removeObservation, refresh, logState, recordEvent, startState, stopState, isRunning, reset };
});
