import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConnectivityStore } from './connectivity';

describe('connectivity store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('follows the browser events and stops listening on demand', () => {
    const target = new EventTarget() as unknown as Pick<Window, 'addEventListener' | 'removeEventListener'> & EventTarget;
    const store = useConnectivityStore();
    const stop = store.listen(target);
    target.dispatchEvent(new Event('offline'));
    expect(store.online).toBe(false);
    target.dispatchEvent(new Event('online'));
    expect(store.online).toBe(true);
    stop();
    target.dispatchEvent(new Event('offline'));
    expect(store.online).toBe(true);
  });

  it('can be set by a failed or a successful request', () => {
    const store = useConnectivityStore();
    store.setOnline(false);
    expect(store.online).toBe(false);
    store.setOnline(true);
    expect(store.online).toBe(true);
  });
});
