import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Animal } from '../api/types';
import AnimalBanner from './AnimalBanner.vue';

const cat: Animal = {
  id: 'a1', name: 'Mistigri', species: 'CAT', breed: null, birthDate: null, sex: null, neutered: false,
  role: 'OWNER' as const, ownerName: null, shareId: null,
  createdAt: '2026-02-20T10:00:00Z',
};

describe('AnimalBanner', () => {
  it('shows the name and the species', () => {
    const wrapper = mount(AnimalBanner, { props: { animal: cat } });
    expect(wrapper.text()).toContain('Mistigri');
    expect(wrapper.text()).toContain('Chat');
  });

  it('adds the age when the birth date is known', () => {
    const wrapper = mount(AnimalBanner, { props: { animal: { ...cat, birthDate: '2020-01-01' } } });
    expect(wrapper.text()).toMatch(/\d+ ans?/);
  });

  it('shows nothing without an animal', () => {
    const wrapper = mount(AnimalBanner, { props: { animal: null } });
    expect(wrapper.text()).toBe('');
  });

  it("tells who shared the animal and with which rights", () => {
    const shared = { ...cat, role: 'VIEWER' as const, ownerName: 'Marie' };
    const wrapper = mount(AnimalBanner, { props: { animal: shared } });
    expect(wrapper.text()).toContain('Lecteur · partagé par Marie');
  });
});
