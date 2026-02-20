import type { BehaviorCategory, StatsSummary } from '../api/types';
import { CATEGORY_HEX } from './setup';

type LabelOf = (category: BehaviorCategory) => string;

/** Doughnut of the measured time per category; null when no state has been measured. */
export function buildTimeBudgetChart(summary: StatsSummary, labelOf: LabelOf) {
  const entries = summary.timeBudget.filter((entry) => entry.durationSeconds > 0);
  if (entries.length === 0) {
    return null;
  }
  return {
    labels: entries.map((entry) => labelOf(entry.category)),
    datasets: [
      {
        data: entries.map((entry) => Math.round(entry.durationSeconds / 60)),
        backgroundColor: entries.map((entry) => CATEGORY_HEX[entry.category]),
        borderWidth: 0,
      },
    ],
  };
}

/** Bars of the number of events per category; null when there is no event. */
export function buildEventsChart(summary: StatsSummary, labelOf: LabelOf) {
  const entries = summary.timeBudget.filter((entry) => entry.eventCount > 0);
  if (entries.length === 0) {
    return null;
  }
  return {
    labels: entries.map((entry) => labelOf(entry.category)),
    datasets: [
      {
        label: 'Événements',
        data: entries.map((entry) => entry.eventCount),
        backgroundColor: entries.map((entry) => CATEGORY_HEX[entry.category]),
      },
    ],
  };
}

/** Stacked bars: observations per day, one dataset per category. */
export function buildTimelineChart(summary: StatsSummary, labelOf: LabelOf) {
  const days = [...new Set(summary.timeline.map((entry) => entry.date))].sort();
  const categories = [...new Set(summary.timeline.map((entry) => entry.category))];
  return {
    labels: days.map((day) => new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
    datasets: categories.map((category) => ({
      label: labelOf(category),
      backgroundColor: CATEGORY_HEX[category],
      data: days.map(
        (day) => summary.timeline.find((entry) => entry.date === day && entry.category === category)?.count ?? 0,
      ),
    })),
  };
}
