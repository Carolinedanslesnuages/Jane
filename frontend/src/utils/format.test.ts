import { describe, expect, it } from 'vitest';
import { computeAge, formatAge, formatDuration, formatPreciseDuration } from './format';

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(42)).toBe('42 s');
    expect(formatDuration(125)).toBe('2 min 05 s');
    expect(formatDuration(5400)).toBe('1 h 30 min');
  });

  it('is empty when there is no duration (events)', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(undefined)).toBe('');
  });
});

describe('formatPreciseDuration', () => {
  it('keeps the tenth of a second under a minute, with a French decimal comma', () => {
    expect(formatPreciseDuration(12.5)).toBe('12,5 s');
    expect(formatPreciseDuration(0)).toBe('0,0 s');
    expect(formatPreciseDuration(59.94)).toBe('59,9 s');
  });

  it('falls back to the usual form beyond a minute and when empty', () => {
    expect(formatPreciseDuration(125)).toBe('2 min 05 s');
    expect(formatPreciseDuration(null)).toBe('');
  });
});

describe('computeAge', () => {
  const today = new Date('2026-01-19T12:00:00Z');

  it('counts whole calendar months', () => {
    expect(computeAge('2020-01-31', today)).toEqual({ years: 5, months: 11 });
    expect(computeAge('2025-01-19', today)).toEqual({ years: 1, months: 0 });
    expect(computeAge('2025-11-19', today)).toEqual({ years: 0, months: 2 });
  });
});

describe('formatAge', () => {
  const today = new Date('2026-01-19T12:00:00Z');

  it('writes the age in French', () => {
    expect(formatAge('2023-05-10', today)).toBe('2 ans 8 mois');
    expect(formatAge('2025-01-19', today)).toBe('1 an 0 mois');
    expect(formatAge('2025-11-19', today)).toBe('2 mois');
  });

  it('handles a missing birth date', () => {
    expect(formatAge(null, today)).toBe('Non renseigné');
  });
});
