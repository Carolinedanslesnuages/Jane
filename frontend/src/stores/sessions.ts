import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { ObservationSession, SessionInput } from '../api/types';
import { NetworkError } from '../offline/outbox';

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<ObservationSession[]>([]);

  /** The session in progress for the loaded animal, if any (an animal has at most one). */
  const openSession = computed(() => sessions.value.find((session) => session.endedAt === null) ?? null);

  /** Loads the sessions of an animal, newest first. Offline, what was loaded stays. */
  async function load(animalId: string) {
    try {
      sessions.value = await api.get<ObservationSession[]>(`/sessions?animalId=${animalId}`);
    } catch (error) {
      if (!(error instanceof NetworkError)) {
        throw error;
      }
    }
  }

  async function start(animalId: string, input: SessionInput) {
    await api.post(`/animals/${animalId}/sessions`, input);
    await load(animalId);
  }

  async function end(animalId: string, sessionId: string, notes?: string) {
    await api.post(`/sessions/${sessionId}/end`, notes ? { notes } : {});
    await load(animalId);
  }

  async function remove(animalId: string, sessionId: string) {
    await api.delete(`/sessions/${sessionId}`);
    await load(animalId);
  }

  function reset() {
    sessions.value = [];
  }

  return { sessions, openSession, load, start, end, remove, reset };
});
