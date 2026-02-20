import { describe, expect, it } from 'vitest';
import { daysAgo, endOfLocalDay, startOfLocalDay, toInputDate } from './period';

describe('period helpers', () => {
  it('formats a local date for a date input', () => {
    expect(toInputDate(new Date(2026, 1, 5))).toBe('2026-02-05');
  });

  it('covers a whole local day', () => {
    const start = new Date(startOfLocalDay('2026-02-20'));
    const end = new Date(endOfLocalDay('2026-02-20'));
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000 - 1);
  });

  it('goes back in time', () => {
    expect(toInputDate(daysAgo(7, new Date(2026, 1, 20)))).toBe('2026-02-13');
  });
});
