import { BehaviorCategory, Observation } from '@prisma/client';

export type StatsObservation = Pick<
  Observation,
  'behavior' | 'category' | 'type' | 'startedAt' | 'recordedAt' | 'durationSeconds' | 'location' | 'stimuli'
>;

const CATEGORIES: BehaviorCategory[] = ['EXPLORATION', 'PLAY', 'REST', 'SOCIAL', 'STRESS', 'ELIMINATION'];

/** The calendar day (AAAA-MM-JJ) of an instant in the given time zone. */
export function localDay(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/** A state belongs to the day it started, an event to the day it happened. */
export function observationDay(observation: StatsObservation, timeZone: string): string {
  return localDay(observation.startedAt ?? observation.recordedAt, timeZone);
}

export interface TotalsStats {
  observations: number;
  observedDays: number;
  measuredSeconds: number;
  stressCount: number;
}

export function computeTotals(observations: StatsObservation[], timeZone: string): TotalsStats {
  return {
    observations: observations.length,
    observedDays: new Set(observations.map((observation) => observationDay(observation, timeZone))).size,
    measuredSeconds: observations
      .filter((observation) => observation.type === 'STATE')
      .reduce((sum, observation) => sum + (observation.durationSeconds ?? 0), 0),
    stressCount: observations.filter((observation) => observation.category === 'STRESS').length,
  };
}

export interface TimeBudgetEntry {
  category: BehaviorCategory;
  /** Total measured time (states only). */
  durationSeconds: number;
  /** Number of instant events. */
  eventCount: number;
}

/** Time spent (states) and number of events, for every category. */
export function computeTimeBudget(observations: StatsObservation[]): TimeBudgetEntry[] {
  return CATEGORIES.map((category) => {
    const ofCategory = observations.filter((observation) => observation.category === category);
    return {
      category,
      durationSeconds: ofCategory
        .filter((observation) => observation.type === 'STATE')
        .reduce((sum, observation) => sum + (observation.durationSeconds ?? 0), 0),
      eventCount: ofCategory.filter((observation) => observation.type === 'EVENT').length,
    };
  });
}

export interface CountEntry {
  label: string;
  count: number;
}

export interface StressStats {
  total: number;
  averagePerDay: number;
  byDay: { date: string; count: number }[];
  byBehavior: CountEntry[];
  byHour: { hour: number; count: number }[];
  byStimulus: CountEntry[];
  byLocation: CountEntry[];
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined): CountEntry[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = key(item);
    if (label) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

/** Hour of the day (0-23) of an instant in the given time zone. */
function localHour(instant: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(instant);
  return Number(hour);
}

/**
 * Stress signs over a period: frequency per day, most frequent behaviours and context.
 * `periodDays` is the number of days of the analysed period, used for the daily average.
 */
export function computeStress(observations: StatsObservation[], timeZone: string, periodDays: number): StressStats {
  const stress = observations.filter((observation) => observation.category === 'STRESS');
  const byDay = countBy(stress, (observation) => observationDay(observation, timeZone))
    .map(({ label, count }) => ({ date: label, count }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const hours = new Map<number, number>();
  for (const observation of stress) {
    const hour = localHour(observation.recordedAt, timeZone);
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  }
  return {
    total: stress.length,
    averagePerDay: stress.length / Math.max(1, periodDays),
    byDay,
    byBehavior: countBy(stress, (observation) => observation.behavior),
    byHour: [...hours.entries()].map(([hour, count]) => ({ hour, count })).sort((left, right) => left.hour - right.hour),
    byStimulus: countBy(stress, (observation) => observation.stimuli),
    byLocation: countBy(stress, (observation) => observation.location),
  };
}

export interface TimelineEntry {
  date: string;
  category: BehaviorCategory;
  count: number;
}

/** Number of observations per day and category (a state counts on the day it started). */
export function computeTimeline(observations: StatsObservation[], timeZone: string): TimelineEntry[] {
  const counts = new Map<string, TimelineEntry>();
  for (const observation of observations) {
    const date = observationDay(observation, timeZone);
    const key = `${date}|${observation.category}`;
    const entry = counts.get(key) ?? { date, category: observation.category, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].sort(
    (left, right) => left.date.localeCompare(right.date) || left.category.localeCompare(right.category),
  );
}
