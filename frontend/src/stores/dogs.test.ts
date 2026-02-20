import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dogsOnServer = [
  { id: 'dog-1', name: 'Luna' },
  { id: 'dog-2', name: 'Rex' },
];

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(async () => dogsOnServer),
    post: vi.fn(async () => ({ id: 'dog-3' })),
    delete: vi.fn(async () => undefined),
  },
}));

import { useDogsStore } from './dogs';

describe('dogs store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('falls back to the first dog when nothing is selected', async () => {
    const store = useDogsStore();
    await store.load();
    expect(store.selectedDog?.name).toBe('Luna');
  });

  it('remembers the selected dog', async () => {
    const store = useDogsStore();
    await store.load();
    store.select('dog-2');
    expect(store.selectedDog?.name).toBe('Rex');
    expect(localStorage.getItem('jane.selectedDogId')).toBe('dog-2');
    setActivePinia(createPinia());
    const reopened = useDogsStore();
    await reopened.load();
    expect(reopened.selectedDog?.name).toBe('Rex');
  });

  it('ignores a remembered dog that no longer exists', async () => {
    localStorage.setItem('jane.selectedDogId', 'deleted-dog');
    const store = useDogsStore();
    await store.load();
    expect(store.selectedDog?.name).toBe('Luna');
  });
});
