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
