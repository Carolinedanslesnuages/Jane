import { validateEnvironment } from './environment';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/jane',
  KEYCLOAK_URL: 'http://localhost:8080/',
  KEYCLOAK_REALM: 'jane',
};

describe('validateEnvironment', () => {
  it('applies defaults and trims the Keycloak URL', () => {
    const environment = validateEnvironment(valid);
    expect(environment.apiPort).toBe(3000);
    expect(environment.keycloakUrl).toBe('http://localhost:8080');
    expect(environment.keycloakApiClientId).toBe('jane-api');
  });

  it('lists every missing variable', () => {
    expect(() => validateEnvironment({})).toThrow(/DATABASE_URL, KEYCLOAK_URL, KEYCLOAK_REALM/);
  });
});
