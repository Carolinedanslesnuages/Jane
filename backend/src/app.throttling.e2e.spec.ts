import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../test/test-app';

describe('rate limiting (HTTP)', () => {
  let app: INestApplication;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 429 once the export limit is exceeded, with a Retry-After hint', async () => {
    const server = app.getHttpServer();
    for (let call = 0; call < 20; call++) {
      await request(server).get('/exports/observations.csv').set(as('alice')).expect(200);
    }
    const refused = await request(server).get('/exports/observations.csv').set(as('alice')).expect(429);
    expect(refused.headers['retry-after']).toBeDefined();
  });

  it('never limits the health checks', async () => {
    const server = app.getHttpServer();
    for (let call = 0; call < 40; call++) {
      await request(server).get('/health/live').expect(200);
    }
  });
});
