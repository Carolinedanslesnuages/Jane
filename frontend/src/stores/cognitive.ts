import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { CognitiveTest, CognitiveTestInput } from '../api/types';
import { NetworkError } from '../offline/outbox';
import { useOutboxStore } from './outbox';

export const useCognitiveStore = defineStore('cognitive', () => {
  const tests = ref<CognitiveTest[]>([]);

  async function load(animalId: string) {
    try {
      tests.value = await api.get<CognitiveTest[]>(`/cognitive-tests?animalId=${animalId}`);
    } catch (error) {
      // Offline: the history stays as it was.
      if (!(error instanceof NetworkError)) {
        throw error;
      }
    }
  }

  /** Records a result: sent at once, or kept on the device (with its date) when there is no network. */
  async function record(animalId: string, input: CognitiveTestInput, label = 'Test cognitif') {
    const queuedBody = { ...input, recordedAt: new Date().toISOString() };
    const outcome = await useOutboxStore().submit(`/animals/${animalId}/cognitive-tests`, input, label, queuedBody);
    if (outcome === 'sent') {
      await load(animalId);
    }
    return outcome;
  }

  /** Corrects a result; `score: null` clears the score. */
  async function update(animalId: string, testId: string, input: Partial<Omit<CognitiveTestInput, 'score'>> & { score?: number | null }) {
    await api.patch(`/cognitive-tests/${testId}`, input);
    await load(animalId);
  }

  async function remove(animalId: string, testId: string) {
    await api.delete(`/cognitive-tests/${testId}`);
    await load(animalId);
  }

  return { tests, load, record, update, remove };
});
