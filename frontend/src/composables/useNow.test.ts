import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNow } from './useNow';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-20T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks with the clock', () => {
    const scope = effectScope();
    const now = scope.run(() => useNow(1000))!;
    const start = now.value;
    vi.advanceTimersByTime(3000);
    expect(now.value - start).toBe(3000);
    scope.stop();
  });

  it('stops ticking when its scope is disposed', () => {
    const scope = effectScope();
    const now = scope.run(() => useNow(1000))!;
    scope.stop();
    const frozen = now.value;
    vi.advanceTimersByTime(5000);
    expect(now.value).toBe(frozen);
  });
});
