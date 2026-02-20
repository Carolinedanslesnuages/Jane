import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { CognitiveTest, CognitiveTestInput } from '../api/types';

export const useCognitiveStore = defineStore('cognitive', () => {
  const tests = ref<CognitiveTest[]>([]);

  async function load(dogId: string) {
    tests.value = await api.get<CognitiveTest[]>(`/cognitive-tests?dogId=${dogId}`);
  }

  async function record(dogId: string, input: CognitiveTestInput) {
    await api.post(`/dogs/${dogId}/cognitive-tests`, input);
    await load(dogId);
  }

  return { tests, load, record };
});
