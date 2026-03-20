import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const apiSend = vi.fn();
const remove = vi.fn();

vi.mock('../auth/keycloak', () => ({ currentSubject: () => 'u1', signOut: vi.fn() }));

vi.mock('../api/client', () => ({
  apiSend: (...args: unknown[]) => apiSend(...args),
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

import { NetworkError } from '../offline/outbox';
import { useConnectivityStore } from './connectivity';
import { useObservationsStore } from './observations';
import { useOutboxStore } from './outbox';

describe('observations store', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    apiSend.mockReset();
    apiSend.mockResolvedValue(undefined);
    localStorage.clear();
    remove.mockReset();
    setActivePinia(createPinia());
    get.mockImplementation(async (path: string) =>
      path.includes('active-states')
        ? [{ id: 's1', behavior: 'Dormir', category: 'REST', startedAt: '2026-02-20T10:00:00Z' }]
        : { items: [{ id: 'o1', behavior: 'Aboyer' }] },
    );
    post.mockResolvedValue({});
  });

  it('loads the running states and the latest observations of an animal', async () => {
    const store = useObservationsStore();
    await store.refresh('animal-1');
    expect(store.isRunning('Dormir')).toBe(true);
    expect(store.isRunning('Courir')).toBe(false);
    expect(store.recent).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/observations?animalId=animal-1&limit=10');
  });

  it('sends the context with an event, then refreshes', async () => {
    const store = useObservationsStore();
    const outcome = await store.recordEvent('animal-1', 'Aboyer', { location: 'Maison', stimuli: 'Bruit' });
    expect(outcome).toBe('sent');
    expect(apiSend).toHaveBeenCalledWith('/animals/animal-1/events', { behavior: 'Aboyer', location: 'Maison', stimuli: 'Bruit' });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('starts and stops a state', async () => {
    const store = useObservationsStore();
    await store.startState('animal-1', 'Dormir');
    await store.stopState('animal-1', 'Dormir', { notes: 'sieste' });
    expect(post).toHaveBeenNthCalledWith(1, '/animals/animal-1/states/start', { behavior: 'Dormir' });
    expect(post).toHaveBeenNthCalledWith(2, '/animals/animal-1/states/stop', { behavior: 'Dormir', notes: 'sieste' });
  });

  it('loads the full history and refreshes it after a deletion', async () => {
    get.mockImplementation(async () => ({ total: 2, items: [{ id: 'o1' }, { id: 'o2' }] }));
    const store = useObservationsStore();
    await store.loadHistory('animal-1');
    expect(store.historyTotal).toBe(2);
    await store.removeObservation('animal-1', 'o1');
    expect(remove).toHaveBeenCalledWith('/observations/o1');
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('logs an elapsed state with its start and end', async () => {
    const store = useObservationsStore();
    await store.logState('animal-1', 'Dormir', '2026-03-05T13:00:00.000Z', '2026-03-05T14:00:00.000Z', { location: 'Maison' });
    expect(apiSend).toHaveBeenCalledWith('/animals/animal-1/states/log', {
      behavior: 'Dormir',
      startedAt: '2026-03-05T13:00:00.000Z',
      endedAt: '2026-03-05T14:00:00.000Z',
      location: 'Maison',
    });
  });

  it('sends the moment of an event noted after the fact', async () => {
    const store = useObservationsStore();
    await store.recordEvent('animal-1', 'Aboyer', { occurredAt: '2026-03-05T08:00:00.000Z' });
    expect(apiSend).toHaveBeenCalledWith('/animals/animal-1/events', { behavior: 'Aboyer', occurredAt: '2026-03-05T08:00:00.000Z' });
  });

  describe('without network', () => {
    it('keeps an event in the outbox with the moment it was noted, and does not reload', async () => {
      const store = useObservationsStore();
      useConnectivityStore().setOnline(false);
      const before = Date.now();
      const outcome = await store.recordEvent('animal-1', 'Aboyer', { location: 'Jardin' }, 'Aboyer (Rex)');
      expect(outcome).toBe('queued');
      expect(apiSend).not.toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
      const [entry] = useOutboxStore().entries();
      expect(entry).toMatchObject({ label: 'Aboyer (Rex)', path: '/animals/animal-1/events' });
      expect(entry.body).toMatchObject({ behavior: 'Aboyer', location: 'Jardin' });
      expect(new Date((entry.body as { occurredAt: string }).occurredAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('keeps an elapsed state in the outbox', async () => {
      const store = useObservationsStore();
      useConnectivityStore().setOnline(false);
      const outcome = await store.logState('animal-1', 'Dormir', '2026-03-05T13:00:00.000Z', '2026-03-05T14:00:00.000Z', {});
      expect(outcome).toBe('queued');
      expect(useOutboxStore().pending).toBe(1);
    });

    it('keeps what is displayed when a reload cannot reach the server', async () => {
      const store = useObservationsStore();
      await store.refresh('animal-1');
      get.mockRejectedValue(new NetworkError('hors ligne'));
      await store.refresh('animal-1');
      expect(store.recent).toHaveLength(1);
      expect(useConnectivityStore().online).toBe(false);
    });
  });
});
