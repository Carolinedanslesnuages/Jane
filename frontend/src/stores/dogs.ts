import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { Dog, DogInput } from '../api/types';

const STORAGE_KEY = 'jane.selectedDogId';

function readStoredSelection(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSelection(dogId: string | null) {
  try {
    if (dogId) {
      localStorage.setItem(STORAGE_KEY, dogId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // The selection simply is not remembered when storage is unavailable.
  }
}

export const useDogsStore = defineStore('dogs', () => {
  const dogs = ref<Dog[]>([]);
  const loaded = ref(false);
  const selectedDogId = ref<string | null>(readStoredSelection());

  /** The dog every observation page works on; falls back to the first dog. */
  const selectedDog = computed<Dog | null>(
    () => dogs.value.find((dog) => dog.id === selectedDogId.value) ?? dogs.value[0] ?? null,
  );

  function select(dogId: string | null) {
    selectedDogId.value = dogId;
    storeSelection(dogId);
  }

  async function load() {
    dogs.value = await api.get<Dog[]>('/dogs');
    loaded.value = true;
  }

  async function create(input: DogInput) {
    const created = await api.post<Dog>('/dogs', input);
    await load();
    if (dogs.value.length === 1) {
      select(created.id);
    }
  }

  async function remove(dogId: string) {
    await api.delete(`/dogs/${dogId}`);
    await load();
  }

  return { dogs, loaded, selectedDogId, selectedDog, select, load, create, remove };
});
