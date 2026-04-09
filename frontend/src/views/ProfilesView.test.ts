import { flushPromises, mount } from '@vue/test-utils';
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

import ProfilesView from './ProfilesView.vue';

const rex = {
  id: 'a1', name: 'Rex', species: 'DOG', breed: null, birthDate: null, sex: null, neutered: false, createdAt: '2026-02-20T10:00:00Z',
  role: 'OWNER', ownerName: null, shareId: null,
};
const mistigri = { ...rex, id: 'a2', name: 'Mistigri', species: 'CAT' };

describe('ProfilesView', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    remove.mockReset();
    patch.mockResolvedValue({});
    get.mockResolvedValue([rex, mistigri]);
    post.mockResolvedValue({ id: 'a3' });
    setActivePinia(createPinia());
  });

  it('sends the chosen species when adding an animal', async () => {
    const wrapper = mount(ProfilesView);
    await flushPromises();
    await wrapper.get('#animal-name').setValue('Éclair');
    await wrapper.get('#animal-species').setValue('HORSE');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(post).toHaveBeenCalledWith('/animals', expect.objectContaining({ name: 'Éclair', species: 'HORSE' }));
  });

  it('shows the species on each card', async () => {
    const wrapper = mount(ProfilesView);
    await flushPromises();
    const cards = wrapper.findAll('article');
    expect(cards).toHaveLength(2);
    expect(cards[0].text()).toContain('Chien');
    expect(cards[1].text()).toContain('Chat');
  });

  it('filters the cards by species', async () => {
    const wrapper = mount(ProfilesView);
    await flushPromises();
    await wrapper.get('#species-filter').setValue('CAT');
    const cards = wrapper.findAll('article');
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain('Mistigri');
  });

  it('edits an animal in place', async () => {
    const wrapper = mount(ProfilesView);
    await flushPromises();
    await wrapper.findAll('article')[0].findAll('button').find((button) => button.text() === 'Modifier')!.trigger('click');
    const nameInput = wrapper.get('#edit-name');
    expect((nameInput.element as HTMLInputElement).value).toBe('Rex');
    await nameInput.setValue('Rexou');
    await wrapper.get('#edit-species').setValue('OTHER');
    expect(wrapper.text()).toContain("Changer l'espèce ne modifie pas");
    await wrapper.findAll('form')[1].trigger('submit');
    await flushPromises();
    expect(patch).toHaveBeenCalledWith('/animals/a1', expect.objectContaining({ name: 'Rexou', species: 'OTHER' }));
    expect(wrapper.find('#edit-name').exists()).toBe(false);
  });

  it('cancels an edit without saving', async () => {
    const wrapper = mount(ProfilesView);
    await flushPromises();
    await wrapper.findAll('article')[0].findAll('button').find((button) => button.text() === 'Modifier')!.trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Annuler')!.trigger('click');
    expect(patch).not.toHaveBeenCalled();
    expect(wrapper.find('#edit-name').exists()).toBe(false);
  });

  it('shows an animal shared by someone else without editing, and lets the person leave', async () => {
    get.mockResolvedValue([rex, { ...mistigri, role: 'OBSERVER', ownerName: 'Marie', shareId: 'sh1' }]);
    remove.mockResolvedValue(undefined);
    const wrapper = mount(ProfilesView);
    await flushPromises();
    const shared = wrapper.findAll('article')[1];
    expect(shared.text()).toContain('Partagé par Marie · Observateur');
    expect(shared.text()).not.toContain('Modifier');
    expect(shared.text()).not.toContain('Supprimer');
    expect(wrapper.findAll('article')[0].text()).toContain('Modifier');

    await shared.findAll('button').find((button) => button.text() === 'Quitter ce partage')!.trigger('click');
    await shared.findAll('button').find((button) => button.text() === 'Confirmer')!.trigger('click');
    await flushPromises();
    expect(remove).toHaveBeenCalledWith('/animals/a2/shares/sh1');
  });

  it('opens a sharing panel for the owner, shares by address and shows who has access', async () => {
    get.mockImplementation(async (path: string) => {
      if (path.endsWith('/shares')) {
        return [{ id: 'sh9', role: 'VIEWER', email: 'paul@jane.test', displayName: 'Paul', createdAt: '2026-04-09' }];
      }
      return [rex];
    });
    post.mockResolvedValue({});
    const wrapper = mount(ProfilesView);
    await flushPromises();
    await wrapper.findAll('article')[0].findAll('button').find((button) => button.text() === 'Partager')!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Partager Rex');
    expect(wrapper.text()).toContain('Paul');
    expect(wrapper.text()).toContain('Lecteur');

    await wrapper.get('input[type="email"]').setValue('marie@jane.test');
    await wrapper.get('.share-form').trigger('submit');
    await flushPromises();
    expect(post).toHaveBeenCalledWith('/animals/a1/shares', { email: 'marie@jane.test', role: 'OBSERVER' });
  });
});
