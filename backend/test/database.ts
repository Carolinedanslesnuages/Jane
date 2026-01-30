import { PrismaService } from '../src/prisma/prisma.service';

/** Opens a Prisma client on the test schema prepared by the global setup. */
export async function createTestDatabase(): Promise<PrismaService> {
  const prisma = new PrismaService();
  await prisma.$connect();
  return prisma;
}

/** Empties every table so each test starts from a clean state. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.cognitiveTest.deleteMany(),
    prisma.activeState.deleteMany(),
    prisma.observation.deleteMany(),
    prisma.dog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
