import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastsStore } from './toasts';

describe('toasts store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a message then removes it by itself', () => {
    const store = useToastsStore();
    store.info('Rex a été ajouté.');
    expect(store.toasts).toHaveLength(1);
    vi.advanceTimersByTime(4001);
    expect(store.toasts).toHaveLength(0);
  });

  it('keeps several messages in order and distinguishes errors', () => {
    const store = useToastsStore();
    store.info('Un');
    store.error('Deux');
    expect(store.toasts.map((toast) => [toast.message, toast.kind])).toEqual([
      ['Un', 'info'],
      ['Deux', 'error'],
    ]);
  });

  it('can be dismissed by hand', () => {
    const store = useToastsStore();
    store.info('Un');
    store.dismiss(store.toasts[0].id);
    expect(store.toasts).toEqual([]);
  });
});
