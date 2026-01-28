import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { VerifiedToken } from '../auth/token-verifier';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the local user for a Keycloak identity, creating it on first sign-in. */
  findOrCreate(identity: VerifiedToken): Promise<User> {
    return this.prisma.user.upsert({
      where: { keycloakSubject: identity.subject },
      create: {
        keycloakSubject: identity.subject,
        email: identity.email,
        displayName: identity.displayName,
      },
      update: {
        email: identity.email,
        displayName: identity.displayName,
      },
    });
  }
}
