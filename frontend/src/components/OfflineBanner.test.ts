import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConnectivityStore } from '../stores/connectivity';
import OfflineBanner from './OfflineBanner.vue';

describe('OfflineBanner', () => {
  const reload = vi.fn();

  beforeEach(() => {
    reload.mockReset();
    vi.stubGlobal('location', { reload });
    setActivePinia(createPinia());
  });

  it('is hidden while online', () => {
    useConnectivityStore().setOnline(true);
    expect(mount(OfflineBanner).html()).toBe('<!--v-if-->');
  });

  it('says that observations are kept when the network drops', () => {
    useConnectivityStore().setOnline(false);
    const wrapper = mount(OfflineBanner);
    expect(wrapper.text()).toContain('Hors ligne');
    expect(wrapper.text()).toContain('conservées sur cet appareil');
    expect(wrapper.text()).not.toContain('reconnectez-vous');
  });

  it('tells an application opened offline to sign in again later', () => {
    useConnectivityStore().startOfflineSession();
    expect(mount(OfflineBanner).text()).toContain('reconnectez-vous');
  });

  it('signs in again by itself when the network comes back after an offline start', async () => {
    const connectivity = useConnectivityStore();
    connectivity.startOfflineSession();
    mount(OfflineBanner);
    connectivity.setOnline(true);
    await nextTick();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload for a plain network drop and recovery', async () => {
    const connectivity = useConnectivityStore();
    connectivity.setOnline(false);
    mount(OfflineBanner);
    connectivity.setOnline(true);
    await nextTick();
    expect(reload).not.toHaveBeenCalled();
  });
});
