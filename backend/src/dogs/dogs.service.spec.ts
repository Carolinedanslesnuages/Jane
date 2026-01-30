import { ConflictException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { PrismaService } from '../prisma/prisma.service';
import { DogsService } from './dogs.service';

describe('DogsService', () => {
  let prisma: PrismaService;
  let service: DogsService;
  let ownerId: string;
  let strangerId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new DogsService(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a dog and lists it alphabetically', async () => {
    await service.create(ownerId, { name: 'Rex', breed: 'Border Collie', birthDate: '2023-05-10', sex: 'MALE', neutered: true });
    await service.create(ownerId, { name: 'Luna' });
    const dogs = await service.list(ownerId);
    expect(dogs.map((dog) => dog.name)).toEqual(['Luna', 'Rex']);
    expect(dogs[1].birthDate?.toISOString().slice(0, 10)).toBe('2023-05-10');
  });

  it('refuses two dogs with the same name for one owner', async () => {
    await service.create(ownerId, { name: 'Rex' });
    await expect(service.create(ownerId, { name: 'Rex' })).rejects.toThrow(ConflictException);
    await expect(service.create(strangerId, { name: 'Rex' })).resolves.toBeDefined();
  });

  it('hides the dogs of other owners', async () => {
    const dog = await service.create(ownerId, { name: 'Rex' });
    expect(await service.list(strangerId)).toEqual([]);
    await expect(service.findOne(strangerId, dog.id)).rejects.toThrow(NotFoundException);
    await expect(service.update(strangerId, dog.id, { name: 'Max' })).rejects.toThrow(NotFoundException);
    await expect(service.remove(strangerId, dog.id)).rejects.toThrow(NotFoundException);
  });

  it('updates only the given fields', async () => {
    const dog = await service.create(ownerId, { name: 'Rex', breed: 'Labrador' });
    const updated = await service.update(ownerId, dog.id, { neutered: true });
    expect(updated).toMatchObject({ name: 'Rex', breed: 'Labrador', neutered: true });
  });

  it('deletes the dog with its observations and tests', async () => {
    const dog = await service.create(ownerId, { name: 'Rex' });
    await prisma.observation.create({
      data: { dogId: dog.id, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' },
    });
    await prisma.cognitiveTest.create({ data: { dogId: dog.id, testType: 'DETOUR', durationSeconds: 12 } });
    await service.remove(ownerId, dog.id);
    expect(await prisma.observation.count()).toBe(0);
    expect(await prisma.cognitiveTest.count()).toBe(0);
  });
});
