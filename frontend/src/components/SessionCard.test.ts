import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
vi.mock('../api/client', () => ({ api: { get: (...args: unknown[]) => get(...args), post: (...args: unknown[]) => post(...args) } }));
vi.mock('../auth/keycloak', () => ({ currentSubject: () => 'u1', signOut: vi.fn(), isOfflineSession: () => false }));

import { useAnimalsStore } from '../stores/animals';
import { useConnectivityStore } from '../stores/connectivity';
import { useSessionStore } from '../stores/session';
import SessionCard from './SessionCard.vue';

const rex = { id: 'a1', name: 'Rex', species: 'DOG' as const, breed: null, birthDate: null, sex: null, neutered: false, createdAt: '2026-03-01T10:00:00Z' };
const open = { id: 's1', animalId: 'a1', observerName: 'Marie', method: 'FOCAL', startedAt: new Date(Date.now() - 125_000).toISOString(), endedAt: null, notes: null, observationCount: 3 };

function setup(sessions: unknown[]) {
  setActivePinia(createPinia());
  get.mockResolvedValue(sessions);
  post.mockResolvedValue({});
  const animals = useAnimalsStore();
  animals.animals = [rex];
  useSessionStore().profile = { id: 'u1', email: 'demo@jane.test', displayName: 'Démo Jane', createdAt: '2026-01-01' };
  return mount(SessionCard);
}

describe('SessionCard', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('offers to start a session with the account name as observer', async () => {
    const wrapper = setup([]);
    await flushPromises();
    expect((wrapper.get('#session-observer').element as HTMLInputElement).value).toBe('Démo Jane');
    await wrapper.get('#session-observer').setValue('Marie');
    await wrapper.get('#session-method').setValue('SCAN');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(post).toHaveBeenCalledWith('/animals/a1/sessions', { observerName: 'Marie', method: 'SCAN' });
  });

  it('shows the session in progress and ends it', async () => {
    const wrapper = setup([open]);
    await flushPromises();
    expect(wrapper.text()).toContain('En cours');
    expect(wrapper.text()).toContain('Marie');
    expect(wrapper.text()).toContain('méthode focal');
    expect(wrapper.text()).toContain('3 observation(s)');
    await wrapper.get('input[aria-label="Remarque de fin de séance"]').setValue('Calme');
    await wrapper.findAll('button').find((button) => button.text() === 'Terminer la séance')!.trigger('click');
    await flushPromises();
    expect(post).toHaveBeenCalledWith('/sessions/s1/end', { notes: 'Calme' });
  });

  it('cannot start or end a session without network, and says why', async () => {
    const wrapper = setup([]);
    await flushPromises();
    useConnectivityStore().setOnline(false);
    await flushPromises();
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('avec du réseau');
  });
});
