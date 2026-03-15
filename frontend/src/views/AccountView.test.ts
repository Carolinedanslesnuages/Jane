import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const remove = vi.fn();
const signOut = vi.fn();

vi.mock('../api/client', () => ({
  api: { get: (...args: unknown[]) => get(...args), delete: (...args: unknown[]) => remove(...args) },
  downloadFile: vi.fn(),
}));
vi.mock('../auth/keycloak', () => ({ signOut: (...args: unknown[]) => signOut(...args) }));

import AccountView from './AccountView.vue';

describe('AccountView', () => {
  beforeEach(() => {
    [get, remove, signOut].forEach((mock) => mock.mockReset());
    get.mockResolvedValue({ id: 'u1', displayName: 'Démo Jane', email: 'demo@jane.test', createdAt: '2026-01-20T10:00:00Z' });
    remove.mockResolvedValue({ identityDeleted: true });
    setActivePinia(createPinia());
  });

  it('shows the profile', async () => {
    const wrapper = mount(AccountView);
    await flushPromises();
    expect(wrapper.text()).toContain('Démo Jane');
    expect(wrapper.text()).toContain('demo@jane.test');
  });

  it('keeps the deletion locked until the confirmation word is typed', async () => {
    const wrapper = mount(AccountView);
    await flushPromises();
    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Supprimer définitivement'))!;
    expect(button.attributes('disabled')).toBeDefined();
    await wrapper.get('#delete-confirmation').setValue('supprimer');
    expect(button.attributes('disabled')).toBeDefined();
    await button.trigger('click');
    expect(remove).not.toHaveBeenCalled();
  });

  it('deletes the account then signs out once confirmed', async () => {
    const wrapper = mount(AccountView);
    await flushPromises();
    await wrapper.get('#delete-confirmation').setValue('SUPPRIMER');
    const button = wrapper.findAll('button').find((entry) => entry.text().includes('Supprimer définitivement'))!;
    expect(button.attributes('disabled')).toBeUndefined();
    await button.trigger('click');
    await flushPromises();
    expect(remove).toHaveBeenCalledWith('/me');
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
