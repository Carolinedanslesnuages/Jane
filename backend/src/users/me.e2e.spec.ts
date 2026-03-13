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

describe('DELETE /me (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('deletes the account and its data, and leaves other accounts alone', async () => {
    const server = app.getHttpServer();
    const as = (token: string) => ({ Authorization: `Bearer ${token}` });
    await request(server).post('/animals').set(as('leaving')).send({ name: 'Rex' }).expect(201);
    await request(server).post('/animals').set(as('staying')).send({ name: 'Luna' }).expect(201);

    const deleted = await request(server).delete('/me').set(as('leaving')).expect(200);
    expect(deleted.body).toEqual({ identityDeleted: false });

    // The same token now starts a brand new, empty account.
    expect((await request(server).get('/animals').set(as('leaving')).expect(200)).body).toEqual([]);
    expect((await request(server).get('/animals').set(as('staying')).expect(200)).body).toHaveLength(1);
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).delete('/me').expect(401);
  });
});
