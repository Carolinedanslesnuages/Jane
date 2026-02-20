import { Injectable } from '@nestjs/common';
import { CognitiveTestType } from '@prisma/client';
import { CognitiveTestsService } from '../cognitive-tests/cognitive-tests.service';
import { DogsService } from '../dogs/dogs.service';
import { ETHOGRAM } from '../ethogram/ethogram';
import { ObservationsService } from '../observations/observations.service';
import { StatsService } from '../stats/stats.service';
import { toCsv } from './csv';
import { ExportQuery, ReportQuery } from './exports.dto';
import { renderReport } from './report';

const CSV_HEADER = [
  'date',
  'chien',
  'comportement',
  'categorie',
  'type',
  'debut',
  'duree_secondes',
  'lieu',
  'meteo',
  'stimuli',
  'notes',
];

@Injectable()
export class ExportsService {
  constructor(
    private readonly observationsService: ObservationsService,
    private readonly dogsService: DogsService,
    private readonly statsService: StatsService,
    private readonly cognitiveTestsService: CognitiveTestsService,
  ) {}

  /** All the observations matching the filters, as a CSV document. */
  async observationsCsv(ownerId: string, query: ExportQuery): Promise<string> {
    const [observations, dogs] = await Promise.all([
      this.observationsService.listAll(ownerId, query),
      this.dogsService.list(ownerId),
    ]);
    const dogNames = new Map(dogs.map((dog) => [dog.id, dog.name]));
    const categoryLabels = new Map(ETHOGRAM.map((entry) => [entry.category, entry.label]));
    const rows = observations.map((observation) => [
      observation.recordedAt,
      dogNames.get(observation.dogId),
      observation.behavior,
      categoryLabels.get(observation.category),
      observation.type === 'EVENT' ? 'evenement' : 'etat',
      observation.startedAt,
      observation.durationSeconds,
      observation.location,
      observation.weather,
      observation.stimuli,
      observation.notes,
    ]);
    return toCsv(CSV_HEADER, rows);
  }

  /** The behavioural assessment of one dog over a period, as a PDF document. */
  async report(ownerId: string, query: ReportQuery): Promise<Buffer> {
    const dog = await this.dogsService.findOne(ownerId, query.dogId);
    const summary = await this.statsService.summary(ownerId, query);
    const tests = await this.cognitiveTestsService.list(ownerId, { dogId: dog.id });
    const categoryLabels = new Map(ETHOGRAM.map((entry) => [entry.category, entry.label]));
    const formatDay = (instant: string) => new Date(instant).toLocaleDateString('fr-FR', { timeZone: query.timezone ?? 'UTC' });

    const testSummaries = [...new Set(tests.map((test) => test.testType))].map((testType) => {
      const ofType = tests.filter((test) => test.testType === testType);
      const scores = ofType.map((test) => test.score).filter((score): score is number => score !== null);
      return {
        label: TEST_LABELS[testType],
        count: ofType.length,
        averageDurationSeconds: ofType.reduce((sum, test) => sum + test.durationSeconds, 0) / ofType.length,
        averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : undefined,
      };
    });

    return renderReport({
      dogName: dog.name,
      generatedAt: new Date(),
      periodLabel: `${formatDay(query.from)} au ${formatDay(query.to)}`,
      totals: summary.totals,
      categories: summary.timeBudget.map((entry) => ({
        label: categoryLabels.get(entry.category) ?? entry.category,
        durationSeconds: entry.durationSeconds,
        eventCount: entry.eventCount,
      })),
      stress: {
        averagePerDay: summary.stress.averagePerDay,
        topBehavior: summary.stress.byBehavior[0]?.label,
        topLocation: summary.stress.byLocation[0]?.label,
        topStimulus: summary.stress.byStimulus[0]?.label,
      },
      cognitiveTests: testSummaries,
    });
  }
}

const TEST_LABELS: Record<CognitiveTestType, string> = {
  OBJECT_PERMANENCE: "Permanence de l'objet",
  DETOUR: 'Test du détour',
  MANIPULATION: 'Test de manipulation',
};
