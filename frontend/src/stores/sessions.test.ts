import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError } from '../offline/outbox';

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

import { useSessionsStore } from './sessions';

const open = { id: 's2', animalId: 'a1', observerName: 'Marie', method: 'FOCAL', startedAt: '2026-03-30T09:00:00Z', endedAt: null, notes: null, observationCount: 0 };
const closed = { ...open, id: 's1', endedAt: '2026-03-29T10:00:00Z', observationCount: 4 };

describe('sessions store', () => {
  beforeEach(() => {
    [get, post, remove].forEach((mock) => mock.mockReset());
    get.mockResolvedValue([open, closed]);
    setActivePinia(createPinia());
  });

  it('finds the session in progress', async () => {
    const store = useSessionsStore();
    await store.load('a1');
    expect(get).toHaveBeenCalledWith('/sessions?animalId=a1');
    expect(store.openSession?.id).toBe('s2');
  });

  it('has no open session when all are over', async () => {
    get.mockResolvedValue([closed]);
    const store = useSessionsStore();
    await store.load('a1');
    expect(store.openSession).toBeNull();
  });

  it('starts a session then reloads', async () => {
    const store = useSessionsStore();
    await store.start('a1', { observerName: 'Marie', method: 'FOCAL' });
    expect(post).toHaveBeenCalledWith('/animals/a1/sessions', { observerName: 'Marie', method: 'FOCAL' });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('ends a session with its closing notes, or without', async () => {
    const store = useSessionsStore();
    await store.end('a1', 's2', 'Calme');
    expect(post).toHaveBeenLastCalledWith('/sessions/s2/end', { notes: 'Calme' });
    await store.end('a1', 's2');
    expect(post).toHaveBeenLastCalledWith('/sessions/s2/end', {});
  });

  it('deletes a session then reloads', async () => {
    const store = useSessionsStore();
    await store.remove('a1', 's1');
    expect(remove).toHaveBeenCalledWith('/sessions/s1');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps what is shown when the network is down', async () => {
    const store = useSessionsStore();
    await store.load('a1');
    get.mockRejectedValue(new NetworkError('hors ligne'));
    await store.load('a1');
    expect(store.sessions).toHaveLength(2);
  });
});
