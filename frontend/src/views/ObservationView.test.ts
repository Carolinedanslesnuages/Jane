import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Animal } from '../api/types';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(async (path: string) => {
      if (path.includes('active-states')) return [];
      if (path.startsWith('/observations')) return { total: 0, items: [] };
      return [];
    }),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useAnimalsStore } from '../stores/animals';
import { useEthogramStore } from '../stores/ethogram';
import ObservationView from './ObservationView.vue';

function animal(overrides: Partial<Animal>): Animal {
  return {
    id: 'a1', name: 'Rex', species: 'DOG', breed: null, birthDate: null, sex: null, neutered: false,
    createdAt: '2026-02-20T10:00:00Z', role: 'OWNER', ownerName: null, shareId: null, ...overrides,
  };
}

const ethograms = {
  DOG: [{ category: 'STRESS' as const, label: 'Stress', behaviors: ['Aboyer'], definitions: { Aboyer: 'Aboiement.' } }],
  CAT: [{ category: 'SOCIAL' as const, label: 'Social', behaviors: ['Ronronner'], definitions: { Ronronner: 'Vibration.' } }],
};

function mountView(selected: Animal) {
  const animalsStore = useAnimalsStore();
  animalsStore.animals = [selected];
  animalsStore.loaded = true;
  animalsStore.load = vi.fn(async () => undefined);
  const ethogramStore = useEthogramStore();
  ethogramStore.bySpecies = ethograms;
  return mount(ObservationView, { global: { stubs: { RouterLink: true } } });
}

describe('ObservationView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("offers the dog's behaviours for a dog", async () => {
    const wrapper = mountView(animal({ species: 'DOG' }));
    await flushPromises();
    const buttons = wrapper.findAll('button').map((button) => button.text());
    expect(buttons).toContain('Aboyer');
    expect(buttons).not.toContain('Ronronner');
  });

  it("offers the cat's behaviours for a cat", async () => {
    const wrapper = mountView(animal({ id: 'a2', name: 'Mistigri', species: 'CAT' }));
    await flushPromises();
    const buttons = wrapper.findAll('button').map((button) => button.text());
    expect(buttons).toContain('Ronronner');
    expect(buttons).not.toContain('Aboyer');
  });

  it('asks to add an animal first when there is none', async () => {
    setActivePinia(createPinia());
    const animalsStore = useAnimalsStore();
    animalsStore.loaded = true;
    animalsStore.load = vi.fn(async () => undefined);
    const wrapper = mount(ObservationView, { global: { stubs: { RouterLink: true } } });
    await flushPromises();
    expect(wrapper.text()).toContain("Ajoutez d'abord un animal");
  });

  it('shows the definitions on demand and remembers the choice', async () => {
    localStorage.clear();
    const wrapper = mountView(animal({ species: 'DOG' }));
    await flushPromises();
    expect(wrapper.text()).not.toContain('Aboiement.');
    await wrapper.get('.definitions-toggle input').setValue(true);
    expect(wrapper.text()).toContain('Aboiement.');
    expect(localStorage.getItem('jane.showDefinitions')).toBe('1');
  });

  it('offers a viewer the observations to read, but no way to record', async () => {
    const wrapper = mountView(animal({ species: 'DOG', role: 'VIEWER', ownerName: 'Marie', shareId: 's1' }));
    await flushPromises();
    expect(wrapper.text()).toContain('lecteur');
    expect(wrapper.text()).toContain('Marie');
    expect(wrapper.text()).toContain('Dernières observations');
    expect(wrapper.findAll('button').map((button) => button.text())).not.toContain('Aboyer');
    expect(wrapper.text()).not.toContain('Démarrer une séance');
  });

  it('lets an observer record on a shared animal', async () => {
    const wrapper = mountView(animal({ species: 'DOG', role: 'OBSERVER', ownerName: 'Marie', shareId: 's1' }));
    await flushPromises();
    expect(wrapper.findAll('button').map((button) => button.text())).toContain('Aboyer');
  });
});
