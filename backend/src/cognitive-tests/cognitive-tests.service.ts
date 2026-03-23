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

  async record(ownerId: string, animalId: string, input: RecordCognitiveTestDto): Promise<CognitiveTest> {
    await this.animalsService.findOne(ownerId, animalId);
    const { recordedAt, ...result } = input;
    return this.prisma.cognitiveTest.create({
      data: { animalId, ...result, ...(recordedAt ? { recordedAt: this.requireNotFuture(new Date(recordedAt)) } : {}) },
    });
  }

  list(ownerId: string, query: ListCognitiveTestsQuery): Promise<CognitiveTest[]> {
    return this.prisma.cognitiveTest.findMany({
      where: {
        animal: { ownerId },
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

  async update(ownerId: string, testId: string, input: UpdateCognitiveTestDto): Promise<CognitiveTest> {
    await this.findOwned(ownerId, testId);
    return this.prisma.cognitiveTest.update({ where: { id: testId }, data: input });
  }

  async remove(ownerId: string, testId: string): Promise<void> {
    await this.findOwned(ownerId, testId);
    await this.prisma.cognitiveTest.delete({ where: { id: testId } });
  }

  private async findOwned(ownerId: string, testId: string): Promise<CognitiveTest> {
    const test = await this.prisma.cognitiveTest.findFirst({ where: { id: testId, animal: { ownerId } } });
    if (!test) {
      throw new NotFoundException('Test introuvable');
    }
    return test;
  }
}
