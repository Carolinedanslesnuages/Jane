import { NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { DogsService } from '../dogs/dogs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CognitiveTestsService } from './cognitive-tests.service';

describe('CognitiveTestsService', () => {
  let prisma: PrismaService;
  let service: CognitiveTestsService;
  let ownerId: string;
  let dogId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new CognitiveTestsService(prisma, new DogsService(prisma));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    dogId = (await prisma.dog.create({ data: { ownerId, name: 'Rex' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores a result with an optional score', async () => {
    const withScore = await service.record(ownerId, dogId, { testType: 'DETOUR', durationSeconds: 12.5, score: 7 });
    const withoutScore = await service.record(ownerId, dogId, { testType: 'DETOUR', durationSeconds: 9 });
    expect(withScore.score).toBe(7);
    expect(withoutScore.score).toBeNull();
  });

  it('filters by dog and by test type', async () => {
    const other = await prisma.dog.create({ data: { ownerId, name: 'Luna' } });
    await service.record(ownerId, dogId, { testType: 'DETOUR', durationSeconds: 10 });
    await service.record(ownerId, dogId, { testType: 'MANIPULATION', durationSeconds: 40 });
    await service.record(ownerId, other.id, { testType: 'DETOUR', durationSeconds: 20 });
    expect(await service.list(ownerId, {})).toHaveLength(3);
    expect(await service.list(ownerId, { dogId })).toHaveLength(2);
    expect(await service.list(ownerId, { testType: 'DETOUR' })).toHaveLength(2);
  });

  it('does not record for someone else\'s dog', async () => {
    const strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
    await expect(service.record(strangerId, dogId, { testType: 'DETOUR', durationSeconds: 5 })).rejects.toThrow(NotFoundException);
    expect(await service.list(strangerId, {})).toEqual([]);
  });
});
