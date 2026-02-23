import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('cognitive tests (HTTP)', () => {
  let app: INestApplication;
  let animalId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    animalId = (await request(app.getHttpServer()).post('/animals').set(as('alice')).send({ name: 'Rex' })).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('records and lists results', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/animals/${animalId}/cognitive-tests`)
      .set(as('alice'))
      .send({ testType: 'DETOUR', durationSeconds: 12.5, score: 7 })
      .expect(201);
    const listed = await request(server).get(`/cognitive-tests?animalId=${animalId}&testType=DETOUR`).set(as('alice')).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ testType: 'DETOUR', durationSeconds: 12.5, score: 7 });
  });

  it('validates the payload', async () => {
    const server = app.getHttpServer();
    const post = (body: object) => request(server).post(`/animals/${animalId}/cognitive-tests`).set(as('alice')).send(body);
    await post({ testType: 'AUTRE', durationSeconds: 5 }).expect(400);
    await post({ testType: 'DETOUR', durationSeconds: 0 }).expect(400);
    await post({ testType: 'DETOUR', durationSeconds: 5, score: 11 }).expect(400);
  });

  it('keeps results private', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/cognitive-tests`).set(as('bob')).send({ testType: 'DETOUR', durationSeconds: 5 }).expect(404);
    expect((await request(server).get('/cognitive-tests').set(as('bob')).expect(200)).body).toEqual([]);
  });
});
