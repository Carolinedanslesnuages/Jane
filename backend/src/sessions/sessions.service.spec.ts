import { ConflictException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { AnimalsService } from '../animals/animals.service';
import { ObservationsService } from '../observations/observations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let prisma: PrismaService;
  let service: SessionsService;
  let observations: ObservationsService;
  let ownerId: string;
  let strangerId: string;
  let animalId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    const animals = new AnimalsService(prisma);
    observations = new ObservationsService(prisma, animals);
    service = new SessionsService(prisma, animals, observations);
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

  it('starts a session with the account name and a free method by default', async () => {
    const session = await service.start(ownerId, animalId, {}, 'Démo Jane');
    expect(session).toMatchObject({ observerName: 'Démo Jane', method: 'AD_LIBITUM', endedAt: null });
  });

  it('keeps the observer and method that were chosen', async () => {
    const session = await service.start(ownerId, animalId, { observerName: ' Marie ', method: 'FOCAL', notes: 'Parc' }, 'Démo Jane');
    expect(session).toMatchObject({ observerName: 'Marie', method: 'FOCAL', notes: 'Parc' });
  });

  it('allows a single open session per animal', async () => {
    await service.start(ownerId, animalId, {}, 'Démo');
    await expect(service.start(ownerId, animalId, {}, 'Démo')).rejects.toThrow(ConflictException);
    const other = await prisma.animal.create({ data: { ownerId, name: 'Luna' } });
    await expect(service.start(ownerId, other.id, {}, 'Démo')).resolves.toBeDefined();
  });

  it('ends a session, stopping the states still running', async () => {
    const session = await service.start(ownerId, animalId, {}, 'Démo');
    await observations.startState(ownerId, animalId, 'Dormir', new Date(Date.now() - 600_000).toISOString());
    const ended = await service.end(ownerId, session.id, { notes: 'Fin de matinée' });
    expect(ended.endedAt).not.toBeNull();
    expect(ended.notes).toBe('Fin de matinée');
    expect(await prisma.activeState.count()).toBe(0);
    const observation = await prisma.observation.findFirstOrThrow({ where: { animalId } });
    expect(observation).toMatchObject({ behavior: 'Dormir', type: 'STATE' });
    expect(observation.durationSeconds).toBeGreaterThan(500);
    await expect(service.end(ownerId, session.id, {})).rejects.toThrow(ConflictException);
  });

  it('lets a new session start once the previous one is over', async () => {
    const first = await service.start(ownerId, animalId, {}, 'Démo');
    await service.end(ownerId, first.id, {});
    await expect(service.start(ownerId, animalId, {}, 'Démo')).resolves.toBeDefined();
  });

  it('lists the sessions newest first with their number of observations', async () => {
    const first = await service.start(ownerId, animalId, {}, 'Démo');
    await prisma.observation.create({ data: { animalId, sessionId: first.id, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' } });
    await service.end(ownerId, first.id, {});
    const second = await service.start(ownerId, animalId, { method: 'SCAN' }, 'Démo');
    const sessions = await service.list(ownerId, { animalId });
    expect(sessions.map((entry) => entry.id)).toEqual([second.id, first.id]);
    expect(sessions.map((entry) => entry.observationCount)).toEqual([0, 1]);
  });

  it('keeps the observations when a session is deleted', async () => {
    const session = await service.start(ownerId, animalId, {}, 'Démo');
    await prisma.observation.create({ data: { animalId, sessionId: session.id, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' } });
    await service.remove(ownerId, session.id);
    expect(await prisma.observationSession.count()).toBe(0);
    expect((await prisma.observation.findFirstOrThrow()).sessionId).toBeNull();
  });

  it("is private to the animal's owner", async () => {
    const session = await service.start(ownerId, animalId, {}, 'Démo');
    await expect(service.start(strangerId, animalId, {}, 'X')).rejects.toThrow(NotFoundException);
    await expect(service.end(strangerId, session.id, {})).rejects.toThrow(NotFoundException);
    await expect(service.findOne(strangerId, session.id)).rejects.toThrow(NotFoundException);
    await expect(service.remove(strangerId, session.id)).rejects.toThrow(NotFoundException);
    expect(await service.list(strangerId, {})).toEqual([]);
  });
});
