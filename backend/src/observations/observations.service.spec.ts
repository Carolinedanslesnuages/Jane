import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { DogsService } from '../dogs/dogs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ObservationsService } from './observations.service';

describe('ObservationsService', () => {
  let prisma: PrismaService;
  let service: ObservationsService;
  let ownerId: string;
  let dogId: string;
  let strangerId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new ObservationsService(prisma, new DogsService(prisma));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
    dogId = (await prisma.dog.create({ data: { ownerId, name: 'Rex' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('recordEvent', () => {
    it('records an event and derives its category', async () => {
      const observation = await service.recordEvent(ownerId, dogId, {
        behavior: 'Aboyer',
        location: 'Maison',
        stimuli: 'Bruit',
      });
      expect(observation).toMatchObject({
        type: 'EVENT',
        category: 'STRESS',
        location: 'Maison',
        stimuli: 'Bruit',
        startedAt: null,
        durationSeconds: null,
      });
    });

    it('rejects a behaviour outside the ethogram', async () => {
      await expect(service.recordEvent(ownerId, dogId, { behavior: 'Voler' })).rejects.toThrow(BadRequestException);
    });

    it('refuses to record for a dog owned by someone else', async () => {
      await expect(service.recordEvent(strangerId, dogId, { behavior: 'Aboyer' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('states', () => {
    it('measures the duration between start and stop', async () => {
      await service.startState(ownerId, dogId, 'Dormir');
      await prisma.activeState.updateMany({ data: { startedAt: new Date(Date.now() - 90_000) } });
      const observation = await service.stopState(ownerId, dogId, { behavior: 'Dormir', location: 'Maison' });
      expect(observation).toMatchObject({ type: 'STATE', category: 'REST', location: 'Maison' });
      expect(observation.durationSeconds).toBeGreaterThanOrEqual(90);
      expect(observation.startedAt).not.toBeNull();
      expect(await service.listActiveStates(ownerId, dogId)).toEqual([]);
    });

    it('refuses to start the same state twice', async () => {
      await service.startState(ownerId, dogId, 'Dormir');
      await expect(service.startState(ownerId, dogId, 'Dormir')).rejects.toThrow(ConflictException);
      await expect(service.startState(ownerId, dogId, 'Courir')).resolves.toBeDefined();
      expect(await service.listActiveStates(ownerId, dogId)).toHaveLength(2);
    });

    it('refuses to stop a state that is not running', async () => {
      await expect(service.stopState(ownerId, dogId, { behavior: 'Dormir' })).rejects.toThrow(NotFoundException);
    });

    it('allows the same behaviour on two different dogs', async () => {
      const otherDog = await prisma.dog.create({ data: { ownerId, name: 'Luna' } });
      await service.startState(ownerId, dogId, 'Dormir');
      await expect(service.startState(ownerId, otherDog.id, 'Dormir')).resolves.toBeDefined();
    });
  });
});
