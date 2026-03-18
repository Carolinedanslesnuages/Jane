import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, Outbox, RejectedError, type OutboxEntry } from './outbox';

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
  };
}

const entry = (label: string, userId = 'u1') => ({ userId, label, path: '/animals/a1/events', body: { behavior: label } });

describe('Outbox', () => {
  let outbox: Outbox;

  beforeEach(() => {
    outbox = new Outbox(createStorage());
  });

  it('keeps the entries in order and per account', () => {
    outbox.add(entry('Aboyer'));
    outbox.add(entry('Courir'));
    outbox.add(entry('Dormir', 'u2'));
    expect(outbox.list('u1').map((item) => item.label)).toEqual(['Aboyer', 'Courir']);
    expect(outbox.list('u2').map((item) => item.label)).toEqual(['Dormir']);
  });

  it('survives a reload (same storage, new instance)', () => {
    const storage = createStorage();
    new Outbox(storage).add(entry('Aboyer'));
    expect(new Outbox(storage).list('u1')).toHaveLength(1);
  });

  it('tolerates corrupted storage', () => {
    const storage = createStorage();
    storage.setItem('jane.outbox', '{pas du json');
    expect(new Outbox(storage).list('u1')).toEqual([]);
  });

  it('sends everything in order and empties the list', async () => {
    outbox.add(entry('Aboyer'));
    outbox.add(entry('Courir'));
    const send = vi.fn(async (_entry: OutboxEntry) => undefined);
    const result = await outbox.flush('u1', send);
    expect(result).toEqual({ sent: 2, rejected: [], interrupted: false });
    expect(send.mock.calls.map(([sent]) => sent.label)).toEqual(['Aboyer', 'Courir']);
    expect(outbox.list('u1')).toEqual([]);
  });

  it('stops at the first network failure and keeps the rest', async () => {
    outbox.add(entry('Aboyer'));
    outbox.add(entry('Courir'));
    outbox.add(entry('Dormir'));
    const send = vi.fn(async (item: OutboxEntry) => {
      if (item.label === 'Courir') throw new NetworkError('hors ligne');
    });
    const result = await outbox.flush('u1', send);
    expect(result).toMatchObject({ sent: 1, interrupted: true });
    expect(outbox.list('u1').map((item) => item.label)).toEqual(['Courir', 'Dormir']);
  });

  it('drops an entry the server refuses and carries on with the others', async () => {
    outbox.add(entry('Voler'));
    outbox.add(entry('Courir'));
    const send = vi.fn(async (item: OutboxEntry) => {
      if (item.label === 'Voler') throw new RejectedError('Comportement inconnu');
    });
    const result = await outbox.flush('u1', send);
    expect(result.sent).toBe(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].message).toBe('Comportement inconnu');
    expect(outbox.list('u1')).toEqual([]);
  });

  it('never sends the entries of another account', async () => {
    outbox.add(entry('Aboyer', 'u1'));
    outbox.add(entry('Dormir', 'u2'));
    const send = vi.fn(async (_entry: OutboxEntry) => undefined);
    await outbox.flush('u1', send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(outbox.list('u2')).toHaveLength(1);
  });
});
