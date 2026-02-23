import { Injectable } from '@nestjs/common';
import { CognitiveTest } from '@prisma/client';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListCognitiveTestsQuery, RecordCognitiveTestDto } from './cognitive-test.dto';

@Injectable()
export class CognitiveTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animalsService: AnimalsService,
  ) {}

  async record(ownerId: string, animalId: string, input: RecordCognitiveTestDto): Promise<CognitiveTest> {
    await this.animalsService.findOne(ownerId, animalId);
    return this.prisma.cognitiveTest.create({ data: { animalId, ...input } });
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
}
