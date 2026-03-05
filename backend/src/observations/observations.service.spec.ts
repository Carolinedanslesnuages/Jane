import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { ObservationsService } from './observations.service';

describe('ObservationsService', () => {
  let prisma: PrismaService;
  let service: ObservationsService;
  let ownerId: string;
  let animalId: string;
  let strangerId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new ObservationsService(prisma, new AnimalsService(prisma));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger' } })).id;
    animalId = (await prisma.animal.create({ data: { ownerId, name: 'Rex' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('recordEvent', () => {
    it('records an event and derives its category', async () => {
      const observation = await service.recordEvent(ownerId, animalId, {
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
      await expect(service.recordEvent(ownerId, animalId, { behavior: 'Voler' })).rejects.toThrow(BadRequestException);
    });

    it('refuses to record for an animal owned by someone else', async () => {
      await expect(service.recordEvent(strangerId, animalId, { behavior: 'Aboyer' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('recording after the fact', () => {
    it('records an event at the given moment', async () => {
      const observation = await service.recordEvent(ownerId, animalId, {
        behavior: 'Aboyer',
        occurredAt: '2026-02-10T08:30:00Z',
      });
      expect(observation.recordedAt.toISOString()).toBe('2026-02-10T08:30:00.000Z');
      expect(observation.startedAt).toBeNull();
    });

    it('refuses an event in the future', async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await expect(service.recordEvent(ownerId, animalId, { behavior: 'Aboyer', occurredAt: tomorrow })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logState', () => {
    it('stores an elapsed state with its duration', async () => {
      const observation = await service.logState(ownerId, animalId, {
        behavior: 'Dormir',
        startedAt: '2026-02-10T13:00:00Z',
        endedAt: '2026-02-10T14:30:00Z',
        location: 'Maison',
      });
      expect(observation).toMatchObject({ type: 'STATE', category: 'REST', durationSeconds: 5400, location: 'Maison' });
      expect(observation.startedAt?.toISOString()).toBe('2026-02-10T13:00:00.000Z');
      expect(observation.recordedAt.toISOString()).toBe('2026-02-10T14:30:00.000Z');
    });

    it('refuses an end before the start, a future end, and an absurd duration', async () => {
      const log = (startedAt: string, endedAt: string) => service.logState(ownerId, animalId, { behavior: 'Dormir', startedAt, endedAt });
      await expect(log('2026-02-10T14:00:00Z', '2026-02-10T13:00:00Z')).rejects.toThrow(BadRequestException);
      await expect(log('2026-02-10T14:00:00Z', '2026-02-10T14:00:00Z')).rejects.toThrow(BadRequestException);
      await expect(log('2026-02-01T00:00:00Z', '2026-02-10T00:00:00Z')).rejects.toThrow(BadRequestException);
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await expect(log(new Date().toISOString(), tomorrow)).rejects.toThrow(BadRequestException);
    });

    it('checks the behaviour against the ethogram and the owner', async () => {
      const input = { behavior: 'Voler', startedAt: '2026-02-10T13:00:00Z', endedAt: '2026-02-10T14:00:00Z' };
      await expect(service.logState(ownerId, animalId, input)).rejects.toThrow(BadRequestException);
      await expect(service.logState(strangerId, animalId, { ...input, behavior: 'Dormir' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('species', () => {
    it("checks the behaviour against the ethogram of the animal's species", async () => {
      const cat = await prisma.animal.create({ data: { ownerId, name: 'Mistigri', species: 'CAT' } });
      await expect(service.recordEvent(ownerId, cat.id, { behavior: 'Ronronner' })).resolves.toMatchObject({ category: 'SOCIAL' });
      await expect(service.recordEvent(ownerId, cat.id, { behavior: 'Aboyer' })).rejects.toThrow(BadRequestException);
      await expect(service.recordEvent(ownerId, animalId, { behavior: 'Ronronner' })).rejects.toThrow(BadRequestException);
    });

    it('applies the same rule to timed states', async () => {
      const horse = await prisma.animal.create({ data: { ownerId, name: 'Éclair', species: 'HORSE' } });
      await expect(service.startState(ownerId, horse.id, 'Dormir debout')).resolves.toMatchObject({ category: 'REST' });
      await expect(service.startState(ownerId, horse.id, 'Flairer le sol')).rejects.toThrow(BadRequestException);
    });
  });

  describe('states', () => {
    it('measures the duration between start and stop', async () => {
      await service.startState(ownerId, animalId, 'Dormir');
      await prisma.activeState.updateMany({ data: { startedAt: new Date(Date.now() - 90_000) } });
      const observation = await service.stopState(ownerId, animalId, { behavior: 'Dormir', location: 'Maison' });
      expect(observation).toMatchObject({ type: 'STATE', category: 'REST', location: 'Maison' });
      expect(observation.durationSeconds).toBeGreaterThanOrEqual(90);
      expect(observation.startedAt).not.toBeNull();
      expect(await service.listActiveStates(ownerId, animalId)).toEqual([]);
    });

    it('refuses to start the same state twice', async () => {
      await service.startState(ownerId, animalId, 'Dormir');
      await expect(service.startState(ownerId, animalId, 'Dormir')).rejects.toThrow(ConflictException);
      await expect(service.startState(ownerId, animalId, 'Courir')).resolves.toBeDefined();
      expect(await service.listActiveStates(ownerId, animalId)).toHaveLength(2);
    });

    it('refuses to stop a state that is not running', async () => {
      await expect(service.stopState(ownerId, animalId, { behavior: 'Dormir' })).rejects.toThrow(NotFoundException);
    });

    it('allows the same behaviour on two different animals', async () => {
      const otherAnimal = await prisma.animal.create({ data: { ownerId, name: 'Luna' } });
      await service.startState(ownerId, animalId, 'Dormir');
      await expect(service.startState(ownerId, otherAnimal.id, 'Dormir')).resolves.toBeDefined();
    });
  });

  describe('list and remove', () => {
    const at = (iso: string) => new Date(iso);

    beforeEach(async () => {
      await prisma.observation.createMany({
        data: [
          { animalId, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT', recordedAt: at('2026-01-10T10:00:00Z') },
          { animalId, behavior: 'Courir', category: 'PLAY', type: 'EVENT', recordedAt: at('2026-01-12T10:00:00Z') },
          {
            animalId,
            behavior: 'Dormir',
            category: 'REST',
            type: 'STATE',
            startedAt: at('2026-01-10T23:50:00Z'),
            recordedAt: at('2026-01-11T00:20:00Z'),
            durationSeconds: 1800,
          },
        ],
      });
    });

    it('returns the newest first with the total', async () => {
      const result = await service.list(ownerId, {});
      expect(result.total).toBe(3);
      expect(result.items.map((item) => item.behavior)).toEqual(['Courir', 'Dormir', 'Aboyer']);
    });

    it('attributes a state to the day it started', async () => {
      const result = await service.list(ownerId, { from: '2026-01-10T00:00:00Z', to: '2026-01-10T23:59:59Z' });
      expect(result.items.map((item) => item.behavior).sort()).toEqual(['Aboyer', 'Dormir']);
    });

    it('filters by animal and paginates', async () => {
      const otherAnimal = await prisma.animal.create({ data: { ownerId, name: 'Luna' } });
      await prisma.observation.create({ data: { animalId: otherAnimal.id, behavior: 'Sauter', category: 'PLAY', type: 'EVENT' } });
      expect((await service.list(ownerId, { animalId: otherAnimal.id })).total).toBe(1);
      const page = await service.list(ownerId, { limit: 2, offset: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.total).toBe(4);
    });

    it('never shows the observations of another owner', async () => {
      expect((await service.list(strangerId, {})).total).toBe(0);
    });

    it('removes an observation only for its owner', async () => {
      const [first] = (await service.list(ownerId, {})).items;
      await expect(service.remove(strangerId, first.id)).rejects.toThrow(NotFoundException);
      await service.remove(ownerId, first.id);
      expect((await service.list(ownerId, {})).total).toBe(2);
    });
  });
});
