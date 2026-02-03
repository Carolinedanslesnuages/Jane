import { BadRequestException, NotFoundException } from '@nestjs/common';
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
});
