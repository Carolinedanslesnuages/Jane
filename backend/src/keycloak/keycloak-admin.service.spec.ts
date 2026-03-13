import { ConfigService } from '@nestjs/config';
import { KeycloakAdminError, KeycloakAdminService } from './keycloak-admin.service';

function createService(values: Record<string, string | undefined> = {}) {
  const config = new ConfigService({
    KEYCLOAK_URL: 'http://localhost:8180/',
    KEYCLOAK_REALM: 'jane',
    KEYCLOAK_ADMIN_CLIENT_ID: 'jane-admin',
    KEYCLOAK_ADMIN_CLIENT_SECRET: 'secret',
    ...values,
  });
  return new KeycloakAdminService(config);
}

function mockFetch(...responses: Array<{ ok: boolean; status: number; json?: unknown }>) {
  const queue = [...responses];
  const fetchMock = jest.fn(async () => {
    const next = queue.shift();
    if (!next) throw new Error('unexpected call');
    return { ok: next.ok, status: next.status, json: async () => next.json } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('KeycloakAdminService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('is configured only when a secret is set', () => {
    expect(createService().isConfigured).toBe(true);
    expect(createService({ KEYCLOAK_ADMIN_CLIENT_SECRET: undefined }).isConfigured).toBe(false);
  });

  it('gets a token with the client credentials, then deletes the user', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: { access_token: 'admin-token' } }, { ok: true, status: 204 });
    await createService().deleteUser('user-1');

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(tokenUrl).toBe('http://localhost:8180/realms/jane/protocol/openid-connect/token');
    expect(String(tokenInit.body)).toContain('grant_type=client_credentials');
    expect(String(tokenInit.body)).toContain('client_id=jane-admin');

    const [deleteUrl, deleteInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(deleteUrl).toBe('http://localhost:8180/admin/realms/jane/users/user-1');
    expect(deleteInit.method).toBe('DELETE');
    expect((deleteInit.headers as Record<string, string>).Authorization).toBe('Bearer admin-token');
  });

  it('treats an already deleted user as done', async () => {
    mockFetch({ ok: true, status: 200, json: { access_token: 't' } }, { ok: false, status: 404 });
    await expect(createService().deleteUser('gone')).resolves.toBeUndefined();
  });

  it('reports a refused deletion and a refused token', async () => {
    mockFetch({ ok: true, status: 200, json: { access_token: 't' } }, { ok: false, status: 403 });
    await expect(createService().deleteUser('user-1')).rejects.toThrow(KeycloakAdminError);
    mockFetch({ ok: false, status: 401 });
    await expect(createService().deleteUser('user-1')).rejects.toThrow('compte de service');
  });
});
