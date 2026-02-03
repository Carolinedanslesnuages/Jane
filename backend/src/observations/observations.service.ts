import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActiveState, Observation, Prisma } from '@prisma/client';
import { DogsService } from '../dogs/dogs.service';
import { findCategory } from '../ethogram/ethogram';
import { PrismaService } from '../prisma/prisma.service';
import { RecordEventDto, StopStateDto } from './observation.dto';

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

  private requireCategory(behavior: string) {
    const category = findCategory(behavior);
    if (!category) {
      throw new BadRequestException(`Comportement inconnu : ${behavior}`);
    }
    return category;
  }
}
