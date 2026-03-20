import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, RejectedError } from '../offline/outbox';

vi.mock('../auth/keycloak', () => ({ getAccessToken: vi.fn(async () => 'token-1') }));

import { api, apiSend, ApiError } from './client';

function respond(status: number, body: unknown = {}) {
  global.fetch = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'texte',
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe('API client', () => {
  beforeEach(() => {
    respond(200, { ok: true });
  });

  it('joins the access token', async () => {
    await api.get('/animals');
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });

  it('turns a network failure into a NetworkError', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    await expect(api.get('/animals')).rejects.toThrow(NetworkError);
    await expect(apiSend('/animals/a1/events', {})).rejects.toThrow(NetworkError);
  });

  it('keeps the server message for a refused request', async () => {
    respond(400, { message: ['name should not be empty', 'breed is too long'] });
    await expect(api.post('/animals', {})).rejects.toThrow(ApiError);
    await expect(api.post('/animals', {})).rejects.toThrow('name should not be empty, breed is too long');
  });

  describe('apiSend', () => {
    it('resolves when the server accepts', async () => {
      respond(201);
      await expect(apiSend('/animals/a1/events', { behavior: 'Aboyer' })).resolves.toBeUndefined();
    });

    it('waits and retries on server errors and expired sessions', async () => {
      for (const status of [500, 502, 401, 429]) {
        respond(status);
        await expect(apiSend('/x', {})).rejects.toThrow(NetworkError);
      }
    });

    it('rejects an entry the server refuses', async () => {
      respond(400, { message: 'Comportement inconnu' });
      await expect(apiSend('/x', {})).rejects.toThrow(RejectedError);
      respond(404, { message: 'Animal introuvable' });
      await expect(apiSend('/x', {})).rejects.toThrow('Animal introuvable');
    });
  });
});
