import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActiveState, Observation, Prisma, Species } from '@prisma/client';
import { AnimalsService } from '../animals/animals.service';
import { findCategory } from '../ethogram/ethogram';
import { PrismaService } from '../prisma/prisma.service';
import { ListObservationsQuery, LogStateDto, RecordEventDto, StopStateDto } from './observation.dto';

/** Clock differences between the browser and the server must not reject "now". */
const FUTURE_TOLERANCE_MS = 60_000;
const MAX_LOGGED_STATE_MS = 48 * 3600 * 1000;

@Injectable()
export class ObservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animalsService: AnimalsService,
  ) {}

  /** Records an instant behaviour (an event). */
  async recordEvent(ownerId: string, animalId: string, input: RecordEventDto): Promise<Observation> {
    const animal = await this.animalsService.findOne(ownerId, animalId);
    const category = this.requireCategory(animal.species, input.behavior);
    const { behavior, occurredAt, ...context } = input;
    const recordedAt = occurredAt ? this.requireNotFuture(new Date(occurredAt), "L'événement") : new Date();
    return this.prisma.observation.create({
      data: { animalId, behavior, category, type: 'EVENT', recordedAt, ...context },
    });
  }

  /** Starts timing a behaviour. A behaviour can only run once at a time for a given animal. */
  async startState(ownerId: string, animalId: string, behavior: string): Promise<ActiveState> {
    const animal = await this.animalsService.findOne(ownerId, animalId);
    const category = this.requireCategory(animal.species, behavior);
    try {
      return await this.prisma.activeState.create({ data: { animalId, behavior, category } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`${behavior} est déjà en cours`);
      }
      throw error;
    }
  }

  /** Stops a running behaviour and stores it as an observation with its duration. */
  async stopState(ownerId: string, animalId: string, input: StopStateDto): Promise<Observation> {
    await this.animalsService.findOne(ownerId, animalId);
    const { behavior, ...context } = input;
    return this.prisma.$transaction(async (transaction) => {
      const running = await transaction.activeState.findUnique({
        where: { animalId_behavior: { animalId, behavior } },
      });
      if (!running) {
        throw new NotFoundException(`${behavior} n'est pas en cours`);
      }
      const stoppedAt = new Date();
      await transaction.activeState.delete({ where: { id: running.id } });
      return transaction.observation.create({
        data: {
          animalId,
          behavior,
          category: running.category,
          type: 'STATE',
          startedAt: running.startedAt,
          recordedAt: stoppedAt,
          durationSeconds: (stoppedAt.getTime() - running.startedAt.getTime()) / 1000,
          ...context,
        },
      });
    });
  }

  /** Records a state that is already over (noted after the fact), with its start and end. */
  async logState(ownerId: string, animalId: string, input: LogStateDto): Promise<Observation> {
    const animal = await this.animalsService.findOne(ownerId, animalId);
    const category = this.requireCategory(animal.species, input.behavior);
    const { behavior, startedAt, endedAt, ...context } = input;
    const start = new Date(startedAt);
    const end = this.requireNotFuture(new Date(endedAt), "La fin de l'état");
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException("La fin de l'état doit être après son début");
    }
    if (end.getTime() - start.getTime() > MAX_LOGGED_STATE_MS) {
      throw new BadRequestException('Un état ne peut pas durer plus de 48 heures');
    }
    return this.prisma.observation.create({
      data: {
        animalId,
        behavior,
        category,
        type: 'STATE',
        startedAt: start,
        recordedAt: end,
        durationSeconds: (end.getTime() - start.getTime()) / 1000,
        ...context,
      },
    });
  }

  /** The states currently running for an animal, oldest first. */
  async listActiveStates(ownerId: string, animalId: string): Promise<ActiveState[]> {
    await this.animalsService.findOne(ownerId, animalId);
    return this.prisma.activeState.findMany({ where: { animalId }, orderBy: { startedAt: 'asc' } });
  }

  /**
   * Lists the observations of the owner's animals, newest first.
   * A state belongs to the period in which it started, an event to the moment it happened.
   */
  async list(ownerId: string, query: ListObservationsQuery): Promise<{ total: number; items: Observation[] }> {
    const where = this.buildWhere(ownerId, query);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.observation.count({ where }),
      this.prisma.observation.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        take: query.limit ?? 100,
        skip: query.offset ?? 0,
      }),
    ]);
    return { total, items };
  }

  /** Every observation matching the filters, without pagination (statistics and exports). */
  listAll(ownerId: string, query: Pick<ListObservationsQuery, 'animalId' | 'from' | 'to'>): Promise<Observation[]> {
    return this.prisma.observation.findMany({
      where: this.buildWhere(ownerId, query),
      orderBy: { recordedAt: 'desc' },
    });
  }

  private buildWhere(
    ownerId: string,
    query: Pick<ListObservationsQuery, 'animalId' | 'from' | 'to'>,
  ): Prisma.ObservationWhereInput {
    const range = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
    const hasRange = Object.keys(range).length > 0;
    return {
      animal: { ownerId },
      ...(query.animalId ? { animalId: query.animalId } : {}),
      ...(hasRange ? { OR: [{ startedAt: range }, { startedAt: null, recordedAt: range }] } : {}),
    };
  }

  async remove(ownerId: string, observationId: string): Promise<void> {
    const found = await this.prisma.observation.findFirst({
      where: { id: observationId, animal: { ownerId } },
    });
    if (!found) {
      throw new NotFoundException('Observation introuvable');
    }
    await this.prisma.observation.delete({ where: { id: observationId } });
  }

  private requireNotFuture(instant: Date, subject: string): Date {
    if (instant.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
      throw new BadRequestException(`${subject} ne peut pas être dans le futur`);
    }
    return instant;
  }

  private requireCategory(species: Species, behavior: string) {
    const category = findCategory(species, behavior);
    if (!category) {
      throw new BadRequestException(`Comportement inconnu : ${behavior}`);
    }
    return category;
  }
}
