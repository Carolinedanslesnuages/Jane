import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { Dog, DogInput } from '../api/types';

export const useDogsStore = defineStore('dogs', () => {
  const dogs = ref<Dog[]>([]);
  const loaded = ref(false);

  async function load() {
    dogs.value = await api.get<Dog[]>('/dogs');
    loaded.value = true;
  }

  async function create(input: DogInput) {
    await api.post<Dog>('/dogs', input);
    await load();
  }

  async function remove(dogId: string) {
    await api.delete(`/dogs/${dogId}`);
    await load();
  }

  return { dogs, loaded, load, create, remove };
});
