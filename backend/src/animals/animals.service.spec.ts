import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('AnimalsService access roles', () => {
  let prisma: PrismaService;
  let service: AnimalsService;
  let ownerId: string;
  let observerId: string;
  let viewerId: string;
  let strangerId: string;
  let animalId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new AnimalsService(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner', displayName: 'Marie' } })).id;
    observerId = (await prisma.user.create({ data: { keycloakSubject: 'observer' } })).id;
    viewerId = (await prisma.user.create({ data: { keycloakSubject: 'viewer' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
    animalId = (await prisma.animal.create({ data: { ownerId, name: 'Rex' } })).id;
    await prisma.animalShare.create({ data: { animalId, userId: observerId, role: 'OBSERVER' } });
    await prisma.animalShare.create({ data: { animalId, userId: viewerId, role: 'VIEWER' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('gives each person the role they hold', async () => {
    expect((await service.requireAccess(ownerId, animalId, 'VIEWER')).role).toBe('OWNER');
    expect((await service.requireAccess(observerId, animalId, 'VIEWER')).role).toBe('OBSERVER');
    expect((await service.requireAccess(viewerId, animalId, 'VIEWER')).role).toBe('VIEWER');
  });

  it('refuses a role that is too low, saying so', async () => {
    await expect(service.requireAccess(viewerId, animalId, 'OBSERVER')).rejects.toThrow(ForbiddenException);
    await expect(service.requireAccess(observerId, animalId, 'OBSERVER')).resolves.toBeDefined();
    await expect(service.requireAccess(observerId, animalId, 'OWNER')).rejects.toThrow(ForbiddenException);
    await expect(service.requireAccess(ownerId, animalId, 'OWNER')).resolves.toBeDefined();
  });

  it('hides the animal from someone it was not shared with', async () => {
    await expect(service.requireAccess(strangerId, animalId, 'VIEWER')).rejects.toThrow(NotFoundException);
  });

  it('lists own and shared animals with the role and who shared them', async () => {
    await prisma.animal.create({ data: { ownerId: observerId, name: 'Luna' } });
    const listed = await service.listAccessible(observerId);
    expect(listed.map((animal) => [animal.name, animal.role, animal.ownerName])).toEqual([
      ['Luna', 'OWNER', null],
      ['Rex', 'OBSERVER', 'Marie'],
    ]);
    expect(await service.listAccessible(strangerId)).toEqual([]);
  });

  it('keeps editing and deleting for the owner only', async () => {
    await expect(service.update(observerId, animalId, { name: 'Max' })).rejects.toThrow(NotFoundException);
    await expect(service.remove(viewerId, animalId)).rejects.toThrow(NotFoundException);
  });
});
