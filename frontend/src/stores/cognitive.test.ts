import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const apiSend = vi.fn();
const patch = vi.fn();
const remove = vi.fn();

vi.mock('../auth/keycloak', () => ({ currentSubject: () => 'u1', signOut: vi.fn() }));

vi.mock('../api/client', () => ({
  apiSend: (...args: unknown[]) => apiSend(...args),
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

import { useConnectivityStore } from './connectivity';
import { useCognitiveStore } from './cognitive';
import { useOutboxStore } from './outbox';

describe('cognitive store', () => {
  beforeEach(() => {
    [get, post, patch, remove, apiSend].forEach((mock) => mock.mockReset());
    apiSend.mockResolvedValue(undefined);
    localStorage.clear();
    get.mockResolvedValue([{ id: 't1' }]);
    setActivePinia(createPinia());
  });

  it("loads an animal's results", async () => {
    const store = useCognitiveStore();
    await store.load('a1');
    expect(get).toHaveBeenCalledWith('/cognitive-tests?animalId=a1');
    expect(store.tests).toHaveLength(1);
  });

  it('records a result then reloads', async () => {
    const store = useCognitiveStore();
    const outcome = await store.record('a1', { testType: 'DETOUR', durationSeconds: 12 });
    expect(outcome).toBe('sent');
    expect(apiSend).toHaveBeenCalledWith('/animals/a1/cognitive-tests', { testType: 'DETOUR', durationSeconds: 12 });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('corrects a result, including clearing its score', async () => {
    const store = useCognitiveStore();
    await store.update('a1', 't1', { durationSeconds: 11, score: null });
    expect(patch).toHaveBeenCalledWith('/cognitive-tests/t1', { durationSeconds: 11, score: null });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('deletes a result then reloads', async () => {
    const store = useCognitiveStore();
    await store.remove('a1', 't1');
    expect(remove).toHaveBeenCalledWith('/cognitive-tests/t1');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps a result noted without network, with its date', async () => {
    const store = useCognitiveStore();
    useConnectivityStore().setOnline(false);
    const outcome = await store.record('a1', { testType: 'DETOUR', durationSeconds: 12 }, 'Test du détour (Rex)');
    expect(outcome).toBe('queued');
    expect(apiSend).not.toHaveBeenCalled();
    const [entry] = useOutboxStore().entries();
    expect(entry.label).toBe('Test du détour (Rex)');
    expect(entry.body).toMatchObject({ testType: 'DETOUR', durationSeconds: 12 });
    expect((entry.body as { recordedAt: string }).recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
