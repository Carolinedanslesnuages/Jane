import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('GET /me (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the profile created from the token', async () => {
    const response = await request(app.getHttpServer()).get('/me').set({ Authorization: 'Bearer alice' }).expect(200);
    expect(response.body).toMatchObject({ email: 'alice@jane.test' });
    expect(response.body.id).toBeDefined();
    expect(response.body.keycloakSubject).toBeUndefined();
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });
});
