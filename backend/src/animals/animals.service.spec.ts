import { ConflictException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { PrismaService } from '../prisma/prisma.service';
import { AnimalsService } from './animals.service';

describe('AnimalsService', () => {
  let prisma: PrismaService;
  let service: AnimalsService;
  let ownerId: string;
  let strangerId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new AnimalsService(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates an animal and lists it alphabetically', async () => {
    await service.create(ownerId, { name: 'Rex', breed: 'Border Collie', birthDate: '2023-05-10', sex: 'MALE', neutered: true });
    await service.create(ownerId, { name: 'Luna' });
    const animals = await service.list(ownerId);
    expect(animals.map((animal) => animal.name)).toEqual(['Luna', 'Rex']);
    expect(animals[1].birthDate?.toISOString().slice(0, 10)).toBe('2023-05-10');
  });

  it('refuses two animals with the same name for one owner', async () => {
    await service.create(ownerId, { name: 'Rex' });
    await expect(service.create(ownerId, { name: 'Rex' })).rejects.toThrow(ConflictException);
    await expect(service.create(strangerId, { name: 'Rex' })).resolves.toBeDefined();
  });

  it('hides the animals of other owners', async () => {
    const animal = await service.create(ownerId, { name: 'Rex' });
    expect(await service.list(strangerId)).toEqual([]);
    await expect(service.findOne(strangerId, animal.id)).rejects.toThrow(NotFoundException);
    await expect(service.update(strangerId, animal.id, { name: 'Max' })).rejects.toThrow(NotFoundException);
    await expect(service.remove(strangerId, animal.id)).rejects.toThrow(NotFoundException);
  });

  it('updates only the given fields', async () => {
    const animal = await service.create(ownerId, { name: 'Rex', breed: 'Labrador' });
    const updated = await service.update(ownerId, animal.id, { neutered: true });
    expect(updated).toMatchObject({ name: 'Rex', breed: 'Labrador', neutered: true });
  });

  it('deletes the animal with its observations and tests', async () => {
    const animal = await service.create(ownerId, { name: 'Rex' });
    await prisma.observation.create({
      data: { animalId: animal.id, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' },
    });
    await prisma.cognitiveTest.create({ data: { animalId: animal.id, testType: 'DETOUR', durationSeconds: 12 } });
    await service.remove(ownerId, animal.id);
    expect(await prisma.observation.count()).toBe(0);
    expect(await prisma.cognitiveTest.count()).toBe(0);
  });
});
