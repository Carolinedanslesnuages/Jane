import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, RejectedError } from '../offline/outbox';

const apiSend = vi.fn();
vi.mock('../api/client', () => ({ apiSend: (...args: unknown[]) => apiSend(...args), api: {} }));
vi.mock('../auth/keycloak', () => ({ signOut: vi.fn() }));

import { useConnectivityStore } from './connectivity';
import { useOutboxStore } from './outbox';
import { useSessionStore } from './session';

function setup(online = true) {
  setActivePinia(createPinia());
  const session = useSessionStore();
  session.profile = { id: 'u1', email: 'demo@jane.test', displayName: null, createdAt: '2026-01-01' };
  const connectivity = useConnectivityStore();
  connectivity.setOnline(online);
  return { outbox: useOutboxStore(), connectivity };
}

describe('outbox store', () => {
  beforeEach(() => {
    localStorage.clear();
    apiSend.mockReset();
    apiSend.mockResolvedValue(undefined);
  });

  it('sends straight away when online', async () => {
    const { outbox } = setup();
    await expect(outbox.submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer')).resolves.toBe('sent');
    expect(apiSend).toHaveBeenCalledWith('/animals/a1/events', { behavior: 'Aboyer' });
    expect(outbox.pending).toBe(0);
  });

  it('keeps the entry, with the moment of the observation, when offline', async () => {
    const { outbox } = setup(false);
    const queued = { behavior: 'Aboyer', occurredAt: '2026-03-18T08:00:00.000Z' };
    await expect(outbox.submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer (Rex)', queued)).resolves.toBe('queued');
    expect(apiSend).not.toHaveBeenCalled();
    expect(outbox.pending).toBe(1);
    expect(outbox.entries()[0]).toMatchObject({ label: 'Aboyer (Rex)', body: queued });
  });

  it('falls back to the queue and marks the app offline when the request cannot get through', async () => {
    const { outbox, connectivity } = setup(true);
    apiSend.mockRejectedValueOnce(new NetworkError('Failed to fetch'));
    await expect(outbox.submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer')).resolves.toBe('queued');
    expect(connectivity.online).toBe(false);
    expect(outbox.pending).toBe(1);
  });

  it('reports an entry the server refuses instead of hiding it in the queue', async () => {
    const { outbox } = setup(true);
    apiSend.mockRejectedValueOnce(new RejectedError('Comportement inconnu'));
    await expect(outbox.submit('/animals/a1/events', { behavior: 'Voler' }, 'Voler')).rejects.toThrow('Comportement inconnu');
    expect(outbox.pending).toBe(0);
  });

  it('sends what is waiting once the network is back', async () => {
    const { outbox, connectivity } = setup(false);
    await outbox.submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer');
    await outbox.submit('/animals/a1/events', { behavior: 'Courir' }, 'Courir');
    const result = await outbox.flush();
    expect(result.sent).toBe(2);
    expect(outbox.pending).toBe(0);
    expect(connectivity.online).toBe(true);
    expect(apiSend).toHaveBeenCalledTimes(2);
  });

  it('keeps the rest and stays offline when the network drops during a flush', async () => {
    const { outbox, connectivity } = setup(false);
    await outbox.submit('/a', { n: 1 }, 'un');
    await outbox.submit('/a', { n: 2 }, 'deux');
    apiSend.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new NetworkError('coupé'));
    const result = await outbox.flush();
    expect(result).toMatchObject({ sent: 1, interrupted: true });
    expect(outbox.pending).toBe(1);
    expect(connectivity.online).toBe(false);
  });

  it('lists refused entries so the observer can be told', async () => {
    const { outbox } = setup(false);
    await outbox.submit('/a', { n: 1 }, 'Voler (Rex)');
    apiSend.mockRejectedValueOnce(new RejectedError('Animal introuvable'));
    await outbox.flush();
    expect(outbox.rejected).toHaveLength(1);
    expect(outbox.rejected[0].entry.label).toBe('Voler (Rex)');
    outbox.dismissRejected();
    expect(outbox.rejected).toEqual([]);
  });
});
