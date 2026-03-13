import { createTestDatabase, resetDatabase } from '../../test/database';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService.deleteAccount', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = await createTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createUserWithData(subject: string) {
    const user = await prisma.user.create({ data: { keycloakSubject: subject } });
    const animal = await prisma.animal.create({ data: { ownerId: user.id, name: 'Rex' } });
    await prisma.observation.create({ data: { animalId: animal.id, behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' } });
    await prisma.activeState.create({ data: { animalId: animal.id, behavior: 'Dormir', category: 'REST' } });
    await prisma.cognitiveTest.create({ data: { animalId: animal.id, testType: 'DETOUR', durationSeconds: 5 } });
    return user;
  }

  it('deletes the user and all their data, but nobody else\'s', async () => {
    const keycloakAdmin = { isConfigured: false, deleteUser: jest.fn() };
    const service = new UsersService(prisma, keycloakAdmin as never);
    const leaving = await createUserWithData('leaving');
    await createUserWithData('staying');

    await expect(service.deleteAccount(leaving)).resolves.toEqual({ identityDeleted: false });

    expect(await prisma.user.findMany({ select: { keycloakSubject: true } })).toEqual([{ keycloakSubject: 'staying' }]);
    expect(await prisma.animal.count()).toBe(1);
    expect(await prisma.observation.count()).toBe(1);
    expect(await prisma.activeState.count()).toBe(1);
    expect(await prisma.cognitiveTest.count()).toBe(1);
    expect(keycloakAdmin.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the sign-in account first when Keycloak administration is configured', async () => {
    const keycloakAdmin = { isConfigured: true, deleteUser: jest.fn().mockResolvedValue(undefined) };
    const service = new UsersService(prisma, keycloakAdmin as never);
    const leaving = await createUserWithData('leaving');
    await expect(service.deleteAccount(leaving)).resolves.toEqual({ identityDeleted: true });
    expect(keycloakAdmin.deleteUser).toHaveBeenCalledWith('leaving');
    expect(await prisma.user.count()).toBe(0);
  });

  it('keeps all the data when Keycloak refuses, so the user can try again', async () => {
    const keycloakAdmin = { isConfigured: true, deleteUser: jest.fn().mockRejectedValue(new Error('refusé')) };
    const service = new UsersService(prisma, keycloakAdmin as never);
    const leaving = await createUserWithData('leaving');
    await expect(service.deleteAccount(leaving)).rejects.toThrow('refusé');
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.animal.count()).toBe(1);
  });
});
