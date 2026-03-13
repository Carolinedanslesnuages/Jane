import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { VerifiedToken } from '../auth/token-verifier';
import { KeycloakAdminService } from '../keycloak/keycloak-admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

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

  /**
   * Deletes everything Jane holds about a user (animals, observations, tests, shares, profile).
   * When Keycloak administration is configured, the sign-in account is deleted first: if that fails,
   * nothing is deleted and the user can try again.
   */
  async deleteAccount(user: User): Promise<{ identityDeleted: boolean }> {
    const identityDeleted = this.keycloakAdmin.isConfigured;
    if (identityDeleted) {
      await this.keycloakAdmin.deleteUser(user.keycloakSubject);
    }
    await this.prisma.user.delete({ where: { id: user.id } });
    return { identityDeleted };
  }
}
