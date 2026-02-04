import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActiveState, Observation, Prisma } from '@prisma/client';
import { DogsService } from '../dogs/dogs.service';
import { findCategory } from '../ethogram/ethogram';
import { PrismaService } from '../prisma/prisma.service';
import { ListObservationsQuery, RecordEventDto, StopStateDto } from './observation.dto';

@Injectable()
export class ObservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dogsService: DogsService,
  ) {}

  /** Records an instant behaviour (an event). */
  async recordEvent(ownerId: string, dogId: string, input: RecordEventDto): Promise<Observation> {
    await this.dogsService.findOne(ownerId, dogId);
    const category = this.requireCategory(input.behavior);
    const { behavior, ...context } = input;
    return this.prisma.observation.create({
      data: { dogId, behavior, category, type: 'EVENT', ...context },
    });
  }

  /** Starts timing a behaviour. A behaviour can only run once at a time for a given dog. */
  async startState(ownerId: string, dogId: string, behavior: string): Promise<ActiveState> {
    await this.dogsService.findOne(ownerId, dogId);
    const category = this.requireCategory(behavior);
    try {
      return await this.prisma.activeState.create({ data: { dogId, behavior, category } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`${behavior} est déjà en cours`);
      }
      throw error;
    }
  }

  /** Stops a running behaviour and stores it as an observation with its duration. */
  async stopState(ownerId: string, dogId: string, input: StopStateDto): Promise<Observation> {
    await this.dogsService.findOne(ownerId, dogId);
    const { behavior, ...context } = input;
    return this.prisma.$transaction(async (transaction) => {
      const running = await transaction.activeState.findUnique({
        where: { dogId_behavior: { dogId, behavior } },
      });
      if (!running) {
        throw new NotFoundException(`${behavior} n'est pas en cours`);
      }
      const stoppedAt = new Date();
      await transaction.activeState.delete({ where: { id: running.id } });
      return transaction.observation.create({
        data: {
          dogId,
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

  /** The states currently running for a dog, oldest first. */
  async listActiveStates(ownerId: string, dogId: string): Promise<ActiveState[]> {
    await this.dogsService.findOne(ownerId, dogId);
    return this.prisma.activeState.findMany({ where: { dogId }, orderBy: { startedAt: 'asc' } });
  }

  /**
   * Lists the observations of the owner's dogs, newest first.
   * A state belongs to the period in which it started, an event to the moment it happened.
   */
  async list(ownerId: string, query: ListObservationsQuery): Promise<{ total: number; items: Observation[] }> {
    const range = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
    const hasRange = Object.keys(range).length > 0;
    const where: Prisma.ObservationWhereInput = {
      dog: { ownerId },
      ...(query.dogId ? { dogId: query.dogId } : {}),
      ...(hasRange
        ? { OR: [{ startedAt: range }, { startedAt: null, recordedAt: range }] }
        : {}),
    };
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

  async remove(ownerId: string, observationId: string): Promise<void> {
    const found = await this.prisma.observation.findFirst({
      where: { id: observationId, dog: { ownerId } },
    });
    if (!found) {
      throw new NotFoundException('Observation introuvable');
    }
    await this.prisma.observation.delete({ where: { id: observationId } });
  }

  private requireCategory(behavior: string) {
    const category = findCategory(behavior);
    if (!category) {
      throw new BadRequestException(`Comportement inconnu : ${behavior}`);
    }
    return category;
  }
}
