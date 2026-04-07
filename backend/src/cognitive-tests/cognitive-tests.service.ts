import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CognitiveTest } from '@prisma/client';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListCognitiveTestsQuery, RecordCognitiveTestDto, UpdateCognitiveTestDto } from './cognitive-test.dto';

@Injectable()
export class CognitiveTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animalsService: AnimalsService,
  ) {}

  async record(userId: string, animalId: string, input: RecordCognitiveTestDto): Promise<CognitiveTest> {
    await this.animalsService.requireAccess(userId, animalId, 'OBSERVER');
    const { recordedAt, ...result } = input;
    return this.prisma.cognitiveTest.create({
      data: { animalId, ...result, ...(recordedAt ? { recordedAt: this.requireNotFuture(new Date(recordedAt)) } : {}) },
    });
  }

  list(userId: string, query: ListCognitiveTestsQuery): Promise<CognitiveTest[]> {
    return this.prisma.cognitiveTest.findMany({
      where: {
        animal: AnimalsService.accessibleBy(userId),
        ...(query.animalId ? { animalId: query.animalId } : {}),
        ...(query.testType ? { testType: query.testType } : {}),
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  private requireNotFuture(instant: Date): Date {
    if (instant.getTime() > Date.now() + 60_000) {
      throw new BadRequestException('Un résultat ne peut pas être daté du futur');
    }
    return instant;
  }

  async update(userId: string, testId: string, input: UpdateCognitiveTestDto): Promise<CognitiveTest> {
    await this.findOwned(userId, testId);
    return this.prisma.cognitiveTest.update({ where: { id: testId }, data: input });
  }

  async remove(userId: string, testId: string): Promise<void> {
    await this.findOwned(userId, testId);
    await this.prisma.cognitiveTest.delete({ where: { id: testId } });
  }

  private async findOwned(userId: string, testId: string): Promise<CognitiveTest> {
    const test = await this.prisma.cognitiveTest.findFirst({
      where: { id: testId, animal: AnimalsService.accessibleBy(userId) },
    });
    if (!test) {
      throw new NotFoundException('Test introuvable');
    }
    // Seeing a result is not enough to change it: that takes the right to record for the animal.
    await this.animalsService.requireAccess(userId, test.animalId, 'OBSERVER');
    return test;
  }
}
