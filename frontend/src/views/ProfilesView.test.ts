import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('../api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: vi.fn(),
  },
}));

import ProfilesView from './ProfilesView.vue';

const rex = { id: 'a1', name: 'Rex', species: 'DOG', breed: null, birthDate: null, sex: null, neutered: false, createdAt: '2026-02-20T10:00:00Z' };
const mistigri = { ...rex, id: 'a2', name: 'Mistigri', species: 'CAT' };

describe('ProfilesView', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
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
});
