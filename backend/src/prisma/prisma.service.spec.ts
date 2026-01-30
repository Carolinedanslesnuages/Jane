import { createTestDatabase, resetDatabase } from '../../test/database';
import { PrismaService } from './prisma.service';

describe('PrismaService (test schema)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = await createTestDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('works against the dedicated test schema', async () => {
    await resetDatabase(prisma);
    const user = await prisma.user.create({ data: { keycloakSubject: 'kc-test' } });
    expect(await prisma.user.count()).toBe(1);
    expect(user.id).toBeDefined();
    await resetDatabase(prisma);
    expect(await prisma.user.count()).toBe(0);
  });
});
