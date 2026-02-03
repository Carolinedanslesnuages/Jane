import { BadRequestException, Injectable } from '@nestjs/common';
import { Observation } from '@prisma/client';
import { DogsService } from '../dogs/dogs.service';
import { findCategory } from '../ethogram/ethogram';
import { PrismaService } from '../prisma/prisma.service';
import { RecordEventDto } from './observation.dto';

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

  private requireCategory(behavior: string) {
    const category = findCategory(behavior);
    if (!category) {
      throw new BadRequestException(`Comportement inconnu : ${behavior}`);
    }
    return category;
  }
}
