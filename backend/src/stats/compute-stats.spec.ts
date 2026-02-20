import { computeStress, computeTimeBudget, computeTimeline, computeTotals, localDay, StatsObservation } from './compute-stats';

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

describe('computeStress', () => {
  const stressful: StatsObservation[] = [
    observation({ behavior: 'Aboyer', stimuli: 'Bruit', location: 'Maison', recordedAt: new Date('2026-01-10T08:10:00Z') }),
    observation({ behavior: 'Aboyer', stimuli: 'Bruit', location: 'Jardin', recordedAt: new Date('2026-01-10T08:50:00Z') }),
    observation({ behavior: 'Bâiller', stimuli: 'Visiteurs', location: '', recordedAt: new Date('2026-01-12T17:00:00Z') }),
    observation({ behavior: 'Courir', category: 'PLAY' }),
  ];

  it('only looks at stress signs and sorts the most frequent first', () => {
    const stats = computeStress(stressful, 'UTC', 4);
    expect(stats.total).toBe(3);
    expect(stats.averagePerDay).toBeCloseTo(0.75);
    expect(stats.byBehavior).toEqual([
      { label: 'Aboyer', count: 2 },
      { label: 'Bâiller', count: 1 },
    ]);
  });

  it('groups by day and hour in the user time zone', () => {
    const stats = computeStress(stressful, 'UTC', 4);
    expect(stats.byDay).toEqual([
      { date: '2026-01-10', count: 2 },
      { date: '2026-01-12', count: 1 },
    ]);
    expect(stats.byHour).toEqual([
      { hour: 8, count: 2 },
      { hour: 17, count: 1 },
    ]);
    expect(computeStress(stressful, 'Europe/Paris', 4).byHour[0].hour).toBe(9);
  });

  it('ignores empty context values', () => {
    const stats = computeStress(stressful, 'UTC', 4);
    expect(stats.byStimulus).toEqual([
      { label: 'Bruit', count: 2 },
      { label: 'Visiteurs', count: 1 },
    ]);
    expect(stats.byLocation).toEqual([
      { label: 'Jardin', count: 1 },
      { label: 'Maison', count: 1 },
    ]);
  });
});

describe('computeTimeline', () => {
  it('counts per day and category, attributing a state to the day it started', () => {
    expect(computeTimeline(sample, 'UTC')).toEqual([
      { date: '2026-01-10', category: 'REST', count: 1 },
      { date: '2026-01-10', category: 'STRESS', count: 1 },
      { date: '2026-01-11', category: 'PLAY', count: 1 },
    ]);
  });

  it('follows the time zone of the user', () => {
    const days = computeTimeline(sample, 'Europe/Paris').map((entry) => entry.date);
    expect(days).toEqual(['2026-01-10', '2026-01-11', '2026-01-11']);
  });
});
