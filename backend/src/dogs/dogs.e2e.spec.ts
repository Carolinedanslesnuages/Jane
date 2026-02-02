import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('/dogs (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/dogs').expect(401);
    await request(app.getHttpServer()).get('/dogs').set(as('invalid')).expect(401);
  });

  it('keeps /health public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('creates, reads, updates and deletes a dog', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/dogs')
      .set(as('alice'))
      .send({ name: 'Rex', breed: 'Border Collie', birthDate: '2023-05-10', sex: 'MALE' })
      .expect(201);
    const dogId = created.body.id;

    const listed = await request(server).get('/dogs').set(as('alice')).expect(200);
    expect(listed.body).toHaveLength(1);

    await request(server).patch(`/dogs/${dogId}`).set(as('alice')).send({ neutered: true }).expect(200);
    const fetched = await request(server).get(`/dogs/${dogId}`).set(as('alice')).expect(200);
    expect(fetched.body.neutered).toBe(true);

    await request(server).get(`/dogs/${dogId}`).set(as('bob')).expect(404);
    await request(server).delete(`/dogs/${dogId}`).set(as('alice')).expect(204);
    await request(server).get(`/dogs/${dogId}`).set(as('alice')).expect(404);
  });

  it('validates the body', async () => {
    const server = app.getHttpServer();
    await request(server).post('/dogs').set(as('alice')).send({}).expect(400);
    await request(server).post('/dogs').set(as('alice')).send({ name: 'Rex', unknown: 1 }).expect(400);
    await request(server).post('/dogs').set(as('alice')).send({ name: 'Rex', birthDate: 'hier' }).expect(400);
  });

  it('answers 409 on a duplicate name', async () => {
    const server = app.getHttpServer();
    await request(server).post('/dogs').set(as('carol')).send({ name: 'Luna' }).expect(201);
    await request(server).post('/dogs').set(as('carol')).send({ name: 'Luna' }).expect(409);
  });
});
