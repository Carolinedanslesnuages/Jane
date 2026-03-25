import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const remove = vi.fn();
const signOut = vi.fn();

vi.mock('../api/client', () => ({ api: { get: (...args: unknown[]) => get(...args), delete: (...args: unknown[]) => remove(...args) } }));
vi.mock('../auth/keycloak', () => ({
  signOut: (...args: unknown[]) => signOut(...args),
  currentSubject: () => 'u1',
  isOfflineSession: () => false,
}));

import { useSessionStore } from './session';

describe('session store', () => {
  beforeEach(() => {
    [get, remove, signOut].forEach((mock) => mock.mockReset());
    setActivePinia(createPinia());
  });

  it('labels the person with their name, else their email', async () => {
    const store = useSessionStore();
    get.mockResolvedValue({ id: 'u1', displayName: 'Démo Jane', email: 'demo@jane.test', createdAt: '2026-01-01' });
    await store.load();
    expect(store.label).toBe('Démo Jane');
    get.mockResolvedValue({ id: 'u1', displayName: null, email: 'demo@jane.test', createdAt: '2026-01-01' });
    await store.load();
    expect(store.label).toBe('demo@jane.test');
  });

  it('signs out only once the account has been deleted', async () => {
    remove.mockResolvedValue({ identityDeleted: true });
    const store = useSessionStore();
    await store.deleteAccount();
    expect(remove).toHaveBeenCalledWith('/me');
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('stays signed in when the deletion fails', async () => {
    remove.mockRejectedValue(new Error('Keycloak a refusé'));
    const store = useSessionStore();
    await expect(store.deleteAccount()).rejects.toThrow('Keycloak a refusé');
    expect(signOut).not.toHaveBeenCalled();
  });
});
