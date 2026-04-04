import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CategoryCard from './CategoryCard.vue';

const category = {
  category: 'REST' as const,
  label: 'Repos',
  behaviors: ['Dormir', 'Se reposer'],
  definitions: { Dormir: 'Yeux fermés, respiration lente.', 'Se reposer': 'Couché, éveillé, immobile.' },
};

describe('CategoryCard', () => {
  it('shows plain behaviour names in event mode and emits the chosen one', async () => {
    const wrapper = mount(CategoryCard, { props: { category, mode: 'EVENT', runningBehaviors: [] } });
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Dormir', 'Se reposer']);
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('choose')).toEqual([['Se reposer']]);
  });

  it('offers to start or stop in state mode', () => {
    const wrapper = mount(CategoryCard, { props: { category, mode: 'STATE', runningBehaviors: ['Dormir'] } });
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Arrêter · Dormir', 'Démarrer · Se reposer']);
    expect(wrapper.findAll('button')[0].classes()).toContain('running');
  });

  it('can be disabled while a request is running', () => {
    const wrapper = mount(CategoryCard, { props: { category, mode: 'EVENT', runningBehaviors: [], disabled: true } });
    expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true);
  });

  it('gives the definition of a behaviour as a tooltip', () => {
    const wrapper = mount(CategoryCard, { props: { category, mode: 'EVENT', runningBehaviors: [] } });
    expect(wrapper.findAll('button')[0].attributes('title')).toBe('Yeux fermés, respiration lente.');
    expect(wrapper.text()).not.toContain('Yeux fermés');
  });

  it('can show the definitions on screen', () => {
    const wrapper = mount(CategoryCard, { props: { category, mode: 'EVENT', runningBehaviors: [], showDefinitions: true } });
    expect(wrapper.text()).toContain('Yeux fermés, respiration lente.');
    expect(wrapper.text()).toContain('Couché, éveillé, immobile.');
  });
});
