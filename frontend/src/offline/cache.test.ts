import { beforeEach, describe, expect, it } from 'vitest';
import { clearCache, loadWithCache, readCache, writeCache } from './cache';
import { NetworkError } from './outbox';

describe('offline cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps a copy of fresh data', async () => {
    const result = await loadWithCache('animals:u1', async () => [{ name: 'Rex' }]);
    expect(result).toEqual({ value: [{ name: 'Rex' }], fromCache: false });
    expect(readCache('animals:u1')).toEqual([{ name: 'Rex' }]);
  });

  it('serves the last copy when the network is down', async () => {
    writeCache('animals:u1', [{ name: 'Rex' }]);
    const result = await loadWithCache('animals:u1', async () => {
      throw new NetworkError('hors ligne');
    });
    expect(result).toEqual({ value: [{ name: 'Rex' }], fromCache: true });
  });

  it('fails when the network is down and nothing was ever loaded', async () => {
    await expect(
      loadWithCache('animals:u2', async () => {
        throw new NetworkError('hors ligne');
      }),
    ).rejects.toThrow(NetworkError);
  });

  it('does not hide other errors behind an old copy', async () => {
    writeCache('animals:u1', [{ name: 'Rex' }]);
    await expect(
      loadWithCache('animals:u1', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('keeps accounts apart and can clear everything', () => {
    writeCache('animals:u1', ['a']);
    writeCache('animals:u2', ['b']);
    expect(readCache('animals:u1')).toEqual(['a']);
    expect(readCache('animals:u2')).toEqual(['b']);
    clearCache();
    expect(readCache('animals:u1')).toBeNull();
  });
});
