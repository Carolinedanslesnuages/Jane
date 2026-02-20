import { Injectable } from '@nestjs/common';
import { DogsService } from '../dogs/dogs.service';
import { ETHOGRAM } from '../ethogram/ethogram';
import { ObservationsService } from '../observations/observations.service';
import { toCsv } from './csv';
import { ExportQuery } from './exports.dto';

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
}
