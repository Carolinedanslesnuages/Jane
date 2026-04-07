import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createTestDatabase, resetDatabase } from '../../test/database';
import { AnimalsService } from '../animals/animals.service';
import { PrismaService } from '../prisma/prisma.service';
import { SharesService } from './shares.service';

describe('SharesService', () => {
  let prisma: PrismaService;
  let service: SharesService;
  let ownerId: string;
  let friendId: string;
  let strangerId: string;
  let animalId: string;

  beforeAll(async () => {
    prisma = await createTestDatabase();
    service = new SharesService(prisma, new AnimalsService(prisma));
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ownerId = (await prisma.user.create({ data: { keycloakSubject: 'owner', email: 'marie@jane.test' } })).id;
    friendId = (await prisma.user.create({ data: { keycloakSubject: 'friend', email: 'Paul@Jane.test', displayName: 'Paul' } })).id;
    strangerId = (await prisma.user.create({ data: { keycloakSubject: 'stranger', email: 'eve@jane.test' } })).id;
    animalId = (await prisma.animal.create({ data: { ownerId, name: 'Rex' } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('shares with the account that has this address, whatever the capital letters', async () => {
    const share = await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'OBSERVER' });
    expect(share).toMatchObject({ role: 'OBSERVER', email: 'Paul@Jane.test', displayName: 'Paul' });
    expect(await service.list(ownerId, animalId)).toHaveLength(1);
  });

  it('changes the role instead of sharing twice', async () => {
    await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'OBSERVER' });
    await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'VIEWER' });
    const shares = await service.list(ownerId, animalId);
    expect(shares).toHaveLength(1);
    expect(shares[0].role).toBe('VIEWER');
  });

  it("explains when nobody has this address, and refuses sharing with oneself", async () => {
    await expect(service.share(ownerId, animalId, { email: 'inconnu@jane.test', role: 'VIEWER' })).rejects.toThrow('doit s\'être connectée');
    await expect(service.share(ownerId, animalId, { email: 'marie@jane.test', role: 'VIEWER' })).rejects.toThrow(BadRequestException);
  });

  it('is reserved to the owner', async () => {
    await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'OBSERVER' });
    await expect(service.share(friendId, animalId, { email: 'eve@jane.test', role: 'VIEWER' })).rejects.toThrow(ForbiddenException);
    await expect(service.list(friendId, animalId)).rejects.toThrow(ForbiddenException);
    await expect(service.share(strangerId, animalId, { email: 'eve@jane.test', role: 'VIEWER' })).rejects.toThrow(NotFoundException);
  });

  it('lets the owner withdraw a share, and the person leave it', async () => {
    const share = await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'OBSERVER' });
    await service.remove(ownerId, animalId, share.id);
    expect(await service.list(ownerId, animalId)).toEqual([]);

    const again = await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'VIEWER' });
    await service.remove(friendId, animalId, again.id);
    expect(await service.list(ownerId, animalId)).toEqual([]);
  });

  it("does not let a person remove someone else's share", async () => {
    const eve = await service.share(ownerId, animalId, { email: 'eve@jane.test', role: 'VIEWER' });
    await service.share(ownerId, animalId, { email: 'paul@jane.test', role: 'VIEWER' });
    await expect(service.remove(friendId, animalId, eve.id)).rejects.toThrow(NotFoundException);
    expect(await service.list(ownerId, animalId)).toHaveLength(2);
  });
});
