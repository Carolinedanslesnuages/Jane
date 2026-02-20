import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStopwatch } from './useStopwatch';

describe('useStopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-20T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('measures the time between start and stop, to a tenth of a second', async () => {
    const scope = effectScope();
    const stopwatch = scope.run(() => useStopwatch())!;
    stopwatch.start();
    expect(stopwatch.running.value).toBe(true);
    await vi.advanceTimersByTimeAsync(12_340);
    expect(stopwatch.stop()).toBe(12.3);
    expect(stopwatch.running.value).toBe(false);
    expect(stopwatch.elapsedSeconds.value).toBe(12.3);
    scope.stop();
  });

  it('can be reset', async () => {
    const scope = effectScope();
    const stopwatch = scope.run(() => useStopwatch())!;
    stopwatch.start();
    await vi.advanceTimersByTimeAsync(5000);
    stopwatch.stop();
    stopwatch.reset();
    expect(stopwatch.elapsedSeconds.value).toBe(0);
    scope.stop();
  });

  it('returns the last measure when stopped twice', async () => {
    const scope = effectScope();
    const stopwatch = scope.run(() => useStopwatch())!;
    stopwatch.start();
    await vi.advanceTimersByTimeAsync(3000);
    stopwatch.stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(stopwatch.stop()).toBe(3);
    scope.stop();
  });
});
