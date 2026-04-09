import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const remove = vi.fn();
vi.mock('../api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

import { useSharesStore } from './shares';

describe('shares store', () => {
  beforeEach(() => {
    [get, post, remove].forEach((mock) => mock.mockReset());
    get.mockResolvedValue([{ id: 's1', role: 'VIEWER', email: 'paul@jane.test', displayName: 'Paul', createdAt: '2026-04-07' }]);
    setActivePinia(createPinia());
  });

  it('loads who an animal is shared with', async () => {
    const store = useSharesStore();
    await store.load('a1');
    expect(get).toHaveBeenCalledWith('/animals/a1/shares');
    expect(store.shares[0].email).toBe('paul@jane.test');
  });

  it('shares with an address and a role, then reloads', async () => {
    const store = useSharesStore();
    await store.share('a1', 'paul@jane.test', 'OBSERVER');
    expect(post).toHaveBeenCalledWith('/animals/a1/shares', { email: 'paul@jane.test', role: 'OBSERVER' });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('withdraws a share, and leaves one without reloading the owner list', async () => {
    const store = useSharesStore();
    await store.remove('a1', 's1');
    expect(remove).toHaveBeenCalledWith('/animals/a1/shares/s1');
    expect(get).toHaveBeenCalledTimes(1);
    await store.leave('a1', 's2');
    expect(remove).toHaveBeenLastCalledWith('/animals/a1/shares/s2');
    expect(get).toHaveBeenCalledTimes(1);
  });
});
