import { NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { CognitiveTestsService } from './cognitive-tests.service';

describe('CognitiveTestsService', () => {
  let prisma: PrismaService;
  let service: CognitiveTestsService;
  let ownerId: string;
  let animalId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new CognitiveTestsService(prisma, new AnimalsService(prisma));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    animalId = (await prisma.animal.create({ data: { ownerId, name: 'Rex' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores a result with an optional score', async () => {
    const withScore = await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 12.5, score: 7 });
    const withoutScore = await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 9 });
    expect(withScore.score).toBe(7);
    expect(withoutScore.score).toBeNull();
  });

  it('filters by animal and by test type', async () => {
    const other = await prisma.animal.create({ data: { ownerId, name: 'Luna' } });
    await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 10 });
    await service.record(ownerId, animalId, { testType: 'MANIPULATION', durationSeconds: 40 });
    await service.record(ownerId, other.id, { testType: 'DETOUR', durationSeconds: 20 });
    expect(await service.list(ownerId, {})).toHaveLength(3);
    expect(await service.list(ownerId, { animalId })).toHaveLength(2);
    expect(await service.list(ownerId, { testType: 'DETOUR' })).toHaveLength(2);
  });

  it('does not record for someone else\'s animal', async () => {
    const strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
    await expect(service.record(strangerId, animalId, { testType: 'DETOUR', durationSeconds: 5 })).rejects.toThrow(NotFoundException);
    expect(await service.list(strangerId, {})).toEqual([]);
  });

  it('corrects only the given fields, and can clear the score', async () => {
    const test = await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 12.5, score: 7, notes: 'ok' });
    const corrected = await service.update(ownerId, test.id, { durationSeconds: 11 });
    expect(corrected).toMatchObject({ durationSeconds: 11, score: 7, notes: 'ok' });
    const cleared = await service.update(ownerId, test.id, { score: null as unknown as undefined });
    expect(cleared.score).toBeNull();
  });

  it('deletes a result', async () => {
    const test = await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 12.5 });
    await service.remove(ownerId, test.id);
    expect(await service.list(ownerId, {})).toEqual([]);
  });

  it("does not let someone else correct or delete a result", async () => {
    const test = await service.record(ownerId, animalId, { testType: 'DETOUR', durationSeconds: 12.5 });
    const strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger-2' } })).id;
    await expect(service.update(strangerId, test.id, { durationSeconds: 1 })).rejects.toThrow(NotFoundException);
    await expect(service.remove(strangerId, test.id)).rejects.toThrow(NotFoundException);
    expect(await service.list(ownerId, {})).toHaveLength(1);
  });
});
