import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('../api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
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
});
