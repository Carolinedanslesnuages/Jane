import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const remove = vi.fn();

vi.mock('../api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

import { useCognitiveStore } from './cognitive';

describe('cognitive store', () => {
  beforeEach(() => {
    [get, post, patch, remove].forEach((mock) => mock.mockReset());
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
    await store.record('a1', { testType: 'DETOUR', durationSeconds: 12 });
    expect(post).toHaveBeenCalledWith('/animals/a1/cognitive-tests', { testType: 'DETOUR', durationSeconds: 12 });
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
});
