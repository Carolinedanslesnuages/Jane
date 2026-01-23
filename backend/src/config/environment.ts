export interface Environment {
  databaseUrl: string;
  apiPort: number;
  webOrigin: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakApiClientId: string;
}

const REQUIRED_VARIABLES = ['DATABASE_URL', 'KEYCLOAK_URL', 'KEYCLOAK_REALM'];

/** Checks the raw environment and returns a typed configuration. */
export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const missing = REQUIRED_VARIABLES.filter((name) => !raw[name]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  return {
    databaseUrl: String(raw.DATABASE_URL),
    apiPort: Number(raw.API_PORT ?? 3300),
    webOrigin: String(raw.WEB_ORIGIN ?? 'http://localhost:5173'),
    keycloakUrl: String(raw.KEYCLOAK_URL).replace(/\/$/, ''),
    keycloakRealm: String(raw.KEYCLOAK_REALM),
    keycloakApiClientId: String(raw.KEYCLOAK_API_CLIENT_ID ?? 'jane-api'),
  };
}
