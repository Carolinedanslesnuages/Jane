import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '../api/client';
import type { Animal, AnimalInput } from '../api/types';

const STORAGE_KEY = 'jane.selectedAnimalId';

function readStoredSelection(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSelection(animalId: string | null) {
  try {
    if (animalId) {
      localStorage.setItem(STORAGE_KEY, animalId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // The selection simply is not remembered when storage is unavailable.
  }
}

export const useAnimalsStore = defineStore('animals', () => {
  const animals = ref<Animal[]>([]);
  const loaded = ref(false);
  const selectedAnimalId = ref<string | null>(readStoredSelection());

  /** The animal every observation page works on; falls back to the first animal. */
  const selectedAnimal = computed<Animal | null>(
    () => animals.value.find((animal) => animal.id === selectedAnimalId.value) ?? animals.value[0] ?? null,
  );

  function select(animalId: string | null) {
    selectedAnimalId.value = animalId;
    storeSelection(animalId);
  }

  async function load() {
    animals.value = await api.get<Animal[]>('/animals');
    loaded.value = true;
  }

  async function create(input: AnimalInput) {
    const created = await api.post<Animal>('/animals', input);
    await load();
    if (animals.value.length === 1) {
      select(created.id);
    }
  }

  async function remove(animalId: string) {
    await api.delete(`/animals/${animalId}`);
    await load();
  }

  return { animals, loaded, selectedAnimalId, selectedAnimal, select, load, create, remove };
});
