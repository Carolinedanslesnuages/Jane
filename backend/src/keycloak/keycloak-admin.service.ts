import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class KeycloakAdminError extends Error {}

/**
 * Talks to the Keycloak admin API with a dedicated service account (client credentials).
 * It is optional: without a client secret, Jane can still delete its own data but not the sign-in account.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);

  constructor(private readonly config: ConfigService) {}

  /** True when a service account is configured. */
  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('KEYCLOAK_ADMIN_CLIENT_SECRET'));
  }

  /** Deletes the sign-in account of a user, identified by its Keycloak subject. */
  async deleteUser(subject: string): Promise<void> {
    const accessToken = await this.requestAdminToken();
    const response = await fetch(`${this.adminUrl}/users/${encodeURIComponent(subject)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // A user that is already gone is not an error: the goal is reached.
    if (!response.ok && response.status !== 404) {
      this.logger.error(`Suppression du compte Keycloak refusée (${response.status})`);
      throw new KeycloakAdminError(`Keycloak a refusé la suppression du compte (${response.status})`);
    }
  }

  private get realmUrl(): string {
    const baseUrl = String(this.config.get('KEYCLOAK_URL')).replace(/\/$/, '');
    return `${baseUrl}/realms/${this.config.get('KEYCLOAK_REALM')}`;
  }

  private get adminUrl(): string {
    return this.realmUrl.replace('/realms/', '/admin/realms/');
  }

  private async requestAdminToken(): Promise<string> {
    const response = await fetch(`${this.realmUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.get<string>('KEYCLOAK_ADMIN_CLIENT_ID') ?? 'jane-admin',
        client_secret: String(this.config.get('KEYCLOAK_ADMIN_CLIENT_SECRET')),
      }),
    });
    if (!response.ok) {
      this.logger.error(`Jeton du compte de service refusé (${response.status})`);
      throw new KeycloakAdminError('Connexion au compte de service Keycloak impossible');
    }
    const payload = (await response.json()) as { access_token?: string };
    if (!payload.access_token) {
      throw new KeycloakAdminError('Réponse Keycloak sans jeton');
    }
    return payload.access_token;
  }
}
