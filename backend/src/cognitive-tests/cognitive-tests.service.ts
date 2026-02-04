import { Injectable } from '@nestjs/common';
import { CognitiveTest } from '@prisma/client';
import { DogsService } from '../dogs/dogs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListCognitiveTestsQuery, RecordCognitiveTestDto } from './cognitive-test.dto';

@Injectable()
export class CognitiveTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dogsService: DogsService,
  ) {}

  async record(ownerId: string, dogId: string, input: RecordCognitiveTestDto): Promise<CognitiveTest> {
    await this.dogsService.findOne(ownerId, dogId);
    return this.prisma.cognitiveTest.create({ data: { dogId, ...input } });
  }

  list(ownerId: string, query: ListCognitiveTestsQuery): Promise<CognitiveTest[]> {
    return this.prisma.cognitiveTest.findMany({
      where: {
        dog: { ownerId },
        ...(query.dogId ? { dogId: query.dogId } : {}),
        ...(query.testType ? { testType: query.testType } : {}),
      },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
