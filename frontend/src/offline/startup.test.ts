import { afterEach, describe, expect, it, vi } from 'vitest';
import { decideStartup, isReachable } from './startup';

describe('decideStartup', () => {
  it('signs in normally when Keycloak answers', () => {
    expect(decideStartup(true, null)).toBe('online');
    expect(decideStartup(true, 'u1')).toBe('online');
  });

  it('opens with local data when Keycloak is down but the device knows an account', () => {
    expect(decideStartup(false, 'u1')).toBe('offline');
  });

  it('is blocked without network on a device that has never signed in', () => {
    expect(decideStartup(false, null)).toBe('blocked');
  });
});

describe('isReachable', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('is true when the server answers, whatever the answer', async () => {
    global.fetch = vi.fn(async () => ({ type: 'opaque' }) as Response) as unknown as typeof fetch;
    await expect(isReachable('http://localhost:8180/realms/jane')).resolves.toBe(true);
  });

  it('is false when the request fails', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(isReachable('http://localhost:8180/realms/jane')).resolves.toBe(false);
  });

  it('gives up when the server does not answer in time', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    ) as unknown as typeof fetch;
    const pending = isReachable('http://localhost:8180/realms/jane', 3000);
    await vi.advanceTimersByTimeAsync(3001);
    await expect(pending).resolves.toBe(false);
  });
});
