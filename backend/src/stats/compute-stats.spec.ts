import { computeTimeBudget, computeTotals, localDay, StatsObservation } from './compute-stats';

function observation(overrides: Partial<StatsObservation>): StatsObservation {
  return {
    behavior: 'Aboyer',
    category: 'STRESS',
    type: 'EVENT',
    startedAt: null,
    recordedAt: new Date('2026-01-10T10:00:00Z'),
    durationSeconds: null,
    location: null,
    stimuli: null,
    ...overrides,
  };
}

const sample: StatsObservation[] = [
  observation({}),
  observation({ behavior: 'Courir', category: 'PLAY', recordedAt: new Date('2026-01-11T09:00:00Z') }),
  observation({
    behavior: 'Dormir',
    category: 'REST',
    type: 'STATE',
    startedAt: new Date('2026-01-10T23:30:00Z'),
    recordedAt: new Date('2026-01-11T00:30:00Z'),
    durationSeconds: 3600,
  }),
];

describe('localDay', () => {
  it('uses the time zone of the user', () => {
    const instant = new Date('2026-01-10T23:30:00Z');
    expect(localDay(instant, 'UTC')).toBe('2026-01-10');
    expect(localDay(instant, 'Europe/Paris')).toBe('2026-01-11');
  });
});

describe('computeTotals', () => {
  it('counts observations, observed days, measured time and stress signs', () => {
    expect(computeTotals(sample, 'UTC')).toEqual({
      observations: 3,
      observedDays: 2,
      measuredSeconds: 3600,
      stressCount: 1,
    });
  });

  it('handles an empty period', () => {
    expect(computeTotals([], 'UTC')).toEqual({ observations: 0, observedDays: 0, measuredSeconds: 0, stressCount: 0 });
  });
});

describe('computeTimeBudget', () => {
  it('lists every category with its measured time and event count', () => {
    const budget = computeTimeBudget(sample);
    expect(budget).toHaveLength(6);
    expect(budget.find((entry) => entry.category === 'REST')).toEqual({ category: 'REST', durationSeconds: 3600, eventCount: 0 });
    expect(budget.find((entry) => entry.category === 'STRESS')).toEqual({ category: 'STRESS', durationSeconds: 0, eventCount: 1 });
    expect(budget.find((entry) => entry.category === 'SOCIAL')).toEqual({ category: 'SOCIAL', durationSeconds: 0, eventCount: 0 });
  });
});
