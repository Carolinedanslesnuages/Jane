import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Observation } from '../api/types';
import { useEthogramStore } from '../stores/ethogram';
import ObservationsTable from './ObservationsTable.vue';

const observations: Observation[] = [
  {
    id: 'o1', animalId: 'd1', behavior: 'Aboyer', category: 'STRESS', type: 'EVENT', startedAt: null,
    recordedAt: '2026-02-20T10:00:00Z', durationSeconds: null, notes: null, location: 'Maison', weather: null, stimuli: null,
  },
  {
    id: 'o2', animalId: 'd1', behavior: 'Dormir', category: 'REST', type: 'STATE', startedAt: '2026-02-20T08:00:00Z',
    recordedAt: '2026-02-20T09:30:00Z', durationSeconds: 5400, notes: null, location: null, weather: null, stimuli: null,
  },
];

describe('ObservationsTable', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useEthogramStore().categories = [
      { category: 'STRESS', label: 'Stress', behaviors: ['Aboyer'] },
      { category: 'REST', label: 'Repos', behaviors: ['Dormir'] },
    ];
  });

  it('shows one row per observation with readable values', () => {
    const wrapper = mount(ObservationsTable, { props: { observations } });
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('Aboyer');
    expect(rows[0].text()).toContain('Stress');
    expect(rows[0].text()).toContain('Événement');
    expect(rows[1].text()).toContain('1 h 30 min');
    expect(rows[1].text()).toContain('État');
  });

  it('explains when there is nothing to show', () => {
    const wrapper = mount(ObservationsTable, { props: { observations: [] } });
    expect(wrapper.text()).toContain('Aucune observation');
  });

  it('only offers deletion when it is allowed, after confirmation', async () => {
    const readOnly = mount(ObservationsTable, { props: { observations } });
    expect(readOnly.text()).not.toContain('Supprimer');

    const editable = mount(ObservationsTable, { props: { observations, removable: true } });
    await editable.get('tbody tr button').trigger('click');
    const confirm = editable.findAll('button').find((button) => button.text() === 'Confirmer');
    await confirm!.trigger('click');
    expect(editable.emitted('remove')?.[0]).toEqual([observations[0]]);
  });
});
