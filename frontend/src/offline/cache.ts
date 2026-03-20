import { NetworkError } from './outbox';

const PREFIX = 'jane.cache.';

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // A full or unavailable storage only means no offline copy.
  }
}

/** Removes every offline copy (used when signing out of a shared device). */
export function clearCache(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
    for (const key of keys) {
      if (key?.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Nothing to clear.
  }
}

/**
 * Loads fresh data and keeps a copy. When the network is down, the last copy is returned instead.
 * Any other error (a refusal, a bug) is not hidden.
 */
export async function loadWithCache<T>(key: string, load: () => Promise<T>): Promise<{ value: T; fromCache: boolean }> {
  try {
    const value = await load();
    writeCache(key, value);
    return { value, fromCache: false };
  } catch (error) {
    const copy = error instanceof NetworkError ? readCache<T>(key) : null;
    if (copy !== null) {
      return { value: copy, fromCache: true };
    }
    throw error;
  }
}
