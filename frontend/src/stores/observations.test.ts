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

import { useObservationsStore } from './observations';

describe('observations store', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    remove.mockReset();
    setActivePinia(createPinia());
    get.mockImplementation(async (path: string) =>
      path.includes('active-states')
        ? [{ id: 's1', behavior: 'Dormir', category: 'REST', startedAt: '2026-02-20T10:00:00Z' }]
        : { items: [{ id: 'o1', behavior: 'Aboyer' }] },
    );
    post.mockResolvedValue({});
  });

  it('loads the running states and the latest observations of a dog', async () => {
    const store = useObservationsStore();
    await store.refresh('dog-1');
    expect(store.isRunning('Dormir')).toBe(true);
    expect(store.isRunning('Courir')).toBe(false);
    expect(store.recent).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/observations?dogId=dog-1&limit=10');
  });

  it('sends the context with an event, then refreshes', async () => {
    const store = useObservationsStore();
    await store.recordEvent('dog-1', 'Aboyer', { location: 'Maison', stimuli: 'Bruit' });
    expect(post).toHaveBeenCalledWith('/dogs/dog-1/events', { behavior: 'Aboyer', location: 'Maison', stimuli: 'Bruit' });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('starts and stops a state', async () => {
    const store = useObservationsStore();
    await store.startState('dog-1', 'Dormir');
    await store.stopState('dog-1', 'Dormir', { notes: 'sieste' });
    expect(post).toHaveBeenNthCalledWith(1, '/dogs/dog-1/states/start', { behavior: 'Dormir' });
    expect(post).toHaveBeenNthCalledWith(2, '/dogs/dog-1/states/stop', { behavior: 'Dormir', notes: 'sieste' });
  });

  it('loads the full history and refreshes it after a deletion', async () => {
    get.mockImplementation(async () => ({ total: 2, items: [{ id: 'o1' }, { id: 'o2' }] }));
    const store = useObservationsStore();
    await store.loadHistory('dog-1');
    expect(store.historyTotal).toBe(2);
    await store.removeObservation('dog-1', 'o1');
    expect(remove).toHaveBeenCalledWith('/observations/o1');
    expect(get).toHaveBeenCalledTimes(2);
  });
});
