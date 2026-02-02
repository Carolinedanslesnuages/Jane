import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TokenVerifier } from '../src/auth/token-verifier';
import { PrismaService } from '../src/prisma/prisma.service';
import { resetDatabase } from './database';

/** Boots the real application; a bearer token "alice" is accepted as the Keycloak subject "alice". */
export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TokenVerifier)
    .useValue({
      verify: async (token: string) => {
        if (token === 'invalid') {
          throw new Error('invalid token');
        }
        return { subject: token, email: `${token}@jane.test` };
      },
    })
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma };
}
