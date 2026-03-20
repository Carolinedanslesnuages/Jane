import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const animalsOnServer = [
  { id: 'animal-1', name: 'Luna' },
  { id: 'animal-2', name: 'Rex' },
];

vi.mock('../auth/keycloak', () => ({ currentSubject: () => 'u1' }));

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(async () => animalsOnServer),
    post: vi.fn(async () => ({ id: 'animal-3' })),
    patch: vi.fn(async () => ({ id: 'animal-1' })),
    delete: vi.fn(async () => undefined),
  },
}));

import { api } from '../api/client';
import { useAnimalsStore } from './animals';

describe('animals store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('falls back to the first animal when nothing is selected', async () => {
    const store = useAnimalsStore();
    await store.load();
    expect(store.selectedAnimal?.name).toBe('Luna');
  });

  it('remembers the selected animal', async () => {
    const store = useAnimalsStore();
    await store.load();
    store.select('animal-2');
    expect(store.selectedAnimal?.name).toBe('Rex');
    expect(localStorage.getItem('jane.selectedAnimalId')).toBe('animal-2');
    setActivePinia(createPinia());
    const reopened = useAnimalsStore();
    await reopened.load();
    expect(reopened.selectedAnimal?.name).toBe('Rex');
  });

  it('ignores a remembered animal that no longer exists', async () => {
    localStorage.setItem('jane.selectedAnimalId', 'deleted-animal');
    const store = useAnimalsStore();
    await store.load();
    expect(store.selectedAnimal?.name).toBe('Luna');
  });

  it('updates an animal then reloads the list', async () => {
    const store = useAnimalsStore();
    await store.update('animal-1', { name: 'Luna II' });
    expect(api.patch).toHaveBeenCalledWith('/animals/animal-1', { name: 'Luna II' });
    expect(api.get).toHaveBeenCalled();
  });

  it('falls back to the offline copy when the network is down', async () => {
    const { NetworkError } = await import('../offline/outbox');
    const store = useAnimalsStore();
    await store.load();
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new NetworkError('hors ligne'));
    store.animals = [];
    await store.load();
    expect(store.animals.map((animal) => animal.name)).toEqual(['Luna', 'Rex']);
    expect(store.loaded).toBe(true);
  });
});
