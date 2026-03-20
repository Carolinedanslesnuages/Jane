import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('../api/client', () => ({ api: { get: (...args: unknown[]) => get(...args) } }));

import { useEthogramStore } from './ethogram';

describe('ethogram store', () => {
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation(async (path: string) => [{ category: 'REST', label: 'Repos', behaviors: [path] }]);
    setActivePinia(createPinia());
  });

  it('loads the ethogram of the requested species', async () => {
    const store = useEthogramStore();
    await store.load('CAT');
    expect(get).toHaveBeenCalledWith('/ethogram?species=CAT');
    expect(store.categoriesFor('CAT')[0].behaviors).toEqual(['/ethogram?species=CAT']);
  });

  it('keeps each species apart and loads each only once', async () => {
    const store = useEthogramStore();
    await store.load('CAT');
    await store.load('CAT');
    await store.load('HORSE');
    expect(get).toHaveBeenCalledTimes(2);
    expect(store.categoriesFor('HORSE')[0].behaviors).toEqual(['/ethogram?species=HORSE']);
    expect(store.categoriesFor('DOG')).toEqual([]);
  });

  it('falls back to the offline copy of the ethogram when the network is down', async () => {
    const { NetworkError } = await import('../offline/outbox');
    await useEthogramStore().load('CAT');
    setActivePinia(createPinia());
    get.mockRejectedValueOnce(new NetworkError('hors ligne'));
    const store = useEthogramStore();
    await store.load('CAT');
    expect(store.categoriesFor('CAT')).toHaveLength(1);
  });
});
