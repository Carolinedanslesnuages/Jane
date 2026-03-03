import { describe, expect, it } from 'vitest';
import type { StatsSummary } from '../api/types';
import {
  buildEventsChart,
  buildStressByBehaviorChart,
  buildStressByDayChart,
  buildStressByHourChart,
  buildTimeBudgetChart,
  buildTimelineChart,
} from './builders';

const labelOf = (category: string) => `label-${category}`;

const summary: StatsSummary = {
  totals: { observations: 4, observedDays: 2, measuredSeconds: 3600, stressCount: 1 },
  timeBudget: [
    { category: 'REST', durationSeconds: 3600, eventCount: 0 },
    { category: 'STRESS', durationSeconds: 0, eventCount: 1 },
    { category: 'PLAY', durationSeconds: 0, eventCount: 2 },
  ],
  stress: { total: 1, averagePerDay: 0.5, byDay: [], byBehavior: [], byHour: [], byStimulus: [], byLocation: [] },
  timeline: [
    { date: '2026-02-19', category: 'REST', count: 1 },
    { date: '2026-02-20', category: 'PLAY', count: 2 },
    { date: '2026-02-20', category: 'STRESS', count: 1 },
  ],
};

describe('chart builders', () => {
  it('shows the measured time in minutes, only for categories that have some', () => {
    const chart = buildTimeBudgetChart(summary, labelOf);
    expect(chart?.labels).toEqual(['label-REST']);
    expect(chart?.datasets[0].data).toEqual([60]);
  });

  it('counts events per category', () => {
    const chart = buildEventsChart(summary, labelOf);
    expect(chart?.labels).toEqual(['label-STRESS', 'label-PLAY']);
    expect(chart?.datasets[0].data).toEqual([1, 2]);
  });

  it('returns null when there is nothing to draw', () => {
    const empty: StatsSummary = { ...summary, timeBudget: [] };
    expect(buildTimeBudgetChart(empty, labelOf)).toBeNull();
    expect(buildEventsChart(empty, labelOf)).toBeNull();
  });

  it('builds one dataset per category with zeros for missing days', () => {
    const chart = buildTimelineChart(summary, labelOf);
    expect(chart.labels).toHaveLength(2);
    const play = chart.datasets.find((dataset) => dataset.label === 'label-PLAY');
    expect(play?.data).toEqual([0, 2]);
  });

  it('draws the stress charts in the stress colour', () => {
    const stressful: StatsSummary = {
      ...summary,
      stress: {
        ...summary.stress,
        byDay: [{ date: '2026-02-19', count: 2 }],
        byBehavior: [{ label: 'Aboyer', count: 2 }],
        byHour: [{ hour: 8, count: 2 }],
      },
    };
    expect(buildStressByDayChart(stressful)?.datasets[0].borderColor).toBe('#b8503e');
    expect(buildStressByBehaviorChart(stressful)?.labels).toEqual(['Aboyer']);
    expect(buildStressByHourChart(stressful)?.labels).toEqual(['8 h']);
  });

  it('draws nothing when there is no stress', () => {
    expect(buildStressByDayChart(summary)).toBeNull();
    expect(buildStressByBehaviorChart(summary)).toBeNull();
    expect(buildStressByHourChart(summary)).toBeNull();
  });

  it('limits the width of the bars', () => {
    expect(buildEventsChart(summary, labelOf)?.datasets[0].maxBarThickness).toBe(72);
    expect(buildTimelineChart(summary, labelOf).datasets[0].maxBarThickness).toBe(72);
  });
});
