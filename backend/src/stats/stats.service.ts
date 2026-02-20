import { BadRequestException, Injectable } from '@nestjs/common';
import { ObservationsService } from '../observations/observations.service';
import {
  computeStress,
  computeTimeBudget,
  computeTimeline,
  computeTotals,
  localDay,
  StressStats,
  TimeBudgetEntry,
  TimelineEntry,
  TotalsStats,
} from './compute-stats';
import { StatsQuery } from './stats.dto';

export interface StatsSummary {
  totals: TotalsStats;
  timeBudget: TimeBudgetEntry[];
  stress: StressStats;
  timeline: TimelineEntry[];
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class StatsService {
  constructor(private readonly observationsService: ObservationsService) {}

  async summary(ownerId: string, query: StatsQuery): Promise<StatsSummary> {
    const timeZone = query.timezone ?? 'UTC';
    this.assertTimeZone(timeZone);
    const observations = await this.observationsService.listAll(ownerId, query);
    return {
      totals: computeTotals(observations, timeZone),
      timeBudget: computeTimeBudget(observations),
      stress: computeStress(observations, timeZone, this.countDays(query, timeZone)),
      timeline: computeTimeline(observations, timeZone),
    };
  }

  /** Number of calendar days covered by the period, both ends included. */
  private countDays(query: StatsQuery, timeZone: string): number {
    const first = Date.parse(localDay(new Date(query.from), timeZone));
    const last = Date.parse(localDay(new Date(query.to), timeZone));
    return Math.max(1, Math.round((last - first) / DAY_IN_MILLISECONDS) + 1);
  }

  private assertTimeZone(timeZone: string): void {
    try {
      new Intl.DateTimeFormat('en', { timeZone });
    } catch {
      throw new BadRequestException(`Fuseau horaire inconnu : ${timeZone}`);
    }
  }
}
