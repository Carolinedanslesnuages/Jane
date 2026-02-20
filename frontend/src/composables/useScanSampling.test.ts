import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScanSampling } from './useScanSampling';

describe('useScanSampling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-20T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create() {
    const scope = effectScope();
    return { scope, scan: scope.run(() => useScanSampling())! };
  }

  it('does nothing until it is started', () => {
    const { scope, scan } = create();
    vi.advanceTimersByTime(10 * 60_000);
    expect(scan.active.value).toBe(false);
    expect(scan.remainingSeconds.value).toBeNull();
    expect(scan.due.value).toBe(false);
    scope.stop();
  });

  it('counts down and rings at the end of the interval', async () => {
    const { scope, scan } = create();
    scan.intervalMinutes.value = 2;
    scan.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(scan.remainingSeconds.value).toBe(60);
    expect(scan.due.value).toBe(false);
    await vi.advanceTimersByTimeAsync(61_000);
    expect(scan.due.value).toBe(true);
    expect(scan.scansDone.value).toBe(1);
    scope.stop();
  });

  it('restarts the countdown after a scan and can be acknowledged', async () => {
    const { scope, scan } = create();
    scan.intervalMinutes.value = 2;
    scan.start();
    await vi.advanceTimersByTimeAsync(2 * 60_000 + 1000);
    scan.acknowledge();
    expect(scan.due.value).toBe(false);
    expect(scan.remainingSeconds.value).toBeGreaterThan(100);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(scan.scansDone.value).toBe(2);
    scope.stop();
  });

  it('stops cleanly', async () => {
    const { scope, scan } = create();
    scan.start();
    scan.stop();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(scan.scansDone.value).toBe(0);
    expect(scan.remainingSeconds.value).toBeNull();
    scope.stop();
  });
});
