import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfirmAction from './ConfirmAction.vue';

function mountComponent() {
  return mount(ConfirmAction, { props: { label: 'Supprimer', message: 'Supprimer définitivement ?' } });
}

describe('ConfirmAction', () => {
  it('does nothing on the first click, it only asks', async () => {
    const wrapper = mountComponent();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.text()).toContain('Supprimer définitivement ?');
  });

  it('emits only after the confirmation', async () => {
    const wrapper = mountComponent();
    await wrapper.get('button').trigger('click');
    const confirm = wrapper.findAll('button').find((button) => button.text() === 'Confirmer');
    await confirm!.trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.text()).toBe('Supprimer');
  });

  it('can be cancelled', async () => {
    const wrapper = mountComponent();
    await wrapper.get('button').trigger('click');
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Annuler');
    await cancel!.trigger('click');
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.text()).toBe('Supprimer');
  });
});
