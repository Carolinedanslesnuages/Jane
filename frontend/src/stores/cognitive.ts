import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { CognitiveTest, CognitiveTestInput } from '../api/types';

export const useCognitiveStore = defineStore('cognitive', () => {
  const tests = ref<CognitiveTest[]>([]);

  async function load(animalId: string) {
    tests.value = await api.get<CognitiveTest[]>(`/cognitive-tests?animalId=${animalId}`);
  }

  async function record(animalId: string, input: CognitiveTestInput) {
    await api.post(`/animals/${animalId}/cognitive-tests`, input);
    await load(animalId);
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
