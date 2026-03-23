import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, effectScope, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, RejectedError } from '../offline/outbox';

const apiSend = vi.fn();
const get = vi.fn();
vi.mock('../api/client', () => ({ apiSend: (...args: unknown[]) => apiSend(...args), api: { get: (...args: unknown[]) => get(...args) } }));
vi.mock('../auth/keycloak', () => ({ currentSubject: () => 'u1', signOut: vi.fn() }));

import SyncStatus from '../components/SyncStatus.vue';
import { useConnectivityStore } from '../stores/connectivity';
import { useOutboxStore } from '../stores/outbox';
import { useToastsStore } from '../stores/toasts';
import { useAutoSync } from './useAutoSync';

describe('useAutoSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    apiSend.mockReset();
    apiSend.mockResolvedValue(undefined);
    get.mockReset();
    get.mockResolvedValue([]);
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function start(online: boolean) {
    const connectivity = useConnectivityStore();
    connectivity.setOnline(online);
    const outbox = useOutboxStore();
    await outbox.submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer (Rex)');
    await outbox.submit('/animals/a1/events', { behavior: 'Courir' }, 'Courir (Rex)');
    const scope = effectScope();
    scope.run(() => useAutoSync());
    return { scope, connectivity, outbox };
  }

  it('sends everything as soon as the network comes back, and says so', async () => {
    const { scope, connectivity, outbox } = await start(false);
    expect(outbox.pending).toBe(2);
    connectivity.setOnline(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(apiSend).toHaveBeenCalledTimes(2);
    expect(outbox.pending).toBe(0);
    expect(useToastsStore().toasts.map((toast) => toast.message)).toContain('2 saisies envoyées.');
    scope.stop();
  });

  it('retries by itself while something waits, even if the browser never says "online"', async () => {
    const { scope, outbox } = await start(false);
    apiSend.mockRejectedValue(new NetworkError('toujours coupé'));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(outbox.pending).toBe(2);
    apiSend.mockResolvedValue(undefined);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(outbox.pending).toBe(0);
    scope.stop();
  });

  it('warns about an entry the server refuses', async () => {
    const { scope } = await start(false);
    apiSend.mockRejectedValueOnce(new RejectedError('Animal introuvable'));
    useConnectivityStore().setOnline(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(useOutboxStore().rejected).toHaveLength(1);
    expect(useToastsStore().toasts.some((toast) => toast.kind === 'error')).toBe(true);
    scope.stop();
  });

  it('sends what was left from a previous visit when the application starts online', async () => {
    const connectivity = useConnectivityStore();
    connectivity.setOnline(false);
    await useOutboxStore().submit('/animals/a1/events', { behavior: 'Aboyer' }, 'Aboyer (Rex)');
    setActivePinia(createPinia());
    useConnectivityStore().setOnline(true);
    const scope = effectScope();
    scope.run(() => useAutoSync());
    await vi.advanceTimersByTimeAsync(10);
    expect(apiSend).toHaveBeenCalledTimes(1);
    scope.stop();
  });
});

describe('SyncStatus', () => {
  beforeEach(() => {
    localStorage.clear();
    apiSend.mockReset();
    setActivePinia(createPinia());
  });

  it('is hidden when nothing waits', () => {
    const wrapper = mount(SyncStatus);
    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  it('lists what waits and offers to send it now', async () => {
    useConnectivityStore().setOnline(false);
    const outbox = useOutboxStore();
    await outbox.submit('/a', { n: 1 }, 'Aboyer (Rex)');
    const wrapper = mount(SyncStatus);
    await nextTick();
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('en attente');
    expect(wrapper.text()).toContain('Aboyer (Rex)');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('sync')).toHaveLength(1);
  });
});
