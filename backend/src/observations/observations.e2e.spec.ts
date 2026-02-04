import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('observations (HTTP)', () => {
  let app: INestApplication;
  let dogId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const created = await request(app.getHttpServer()).post('/dogs').set(as('alice')).send({ name: 'Rex' });
    dogId = created.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('records an event then lists it', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/dogs/${dogId}/events`).set(as('alice')).send({ behavior: 'Aboyer', stimuli: 'Bruit' }).expect(201);
    const listed = await request(server).get(`/observations?dogId=${dogId}`).set(as('alice')).expect(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.items[0]).toMatchObject({ behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' });
  });

  it('runs a full state cycle', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/dogs/${dogId}/states/start`).set(as('alice')).send({ behavior: 'Dormir' }).expect(201);
    await request(server).post(`/dogs/${dogId}/states/start`).set(as('alice')).send({ behavior: 'Dormir' }).expect(409);
    const running = await request(server).get(`/dogs/${dogId}/active-states`).set(as('alice')).expect(200);
    expect(running.body).toHaveLength(1);
    const stopped = await request(server).post(`/dogs/${dogId}/states/stop`).set(as('alice')).send({ behavior: 'Dormir' }).expect(200);
    expect(stopped.body).toMatchObject({ type: 'STATE', category: 'REST' });
    await request(server).post(`/dogs/${dogId}/states/stop`).set(as('alice')).send({ behavior: 'Dormir' }).expect(404);
  });

  it('rejects unknown behaviours and bad queries', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/dogs/${dogId}/events`).set(as('alice')).send({ behavior: 'Voler' }).expect(400);
    await request(server).get('/observations?limit=0').set(as('alice')).expect(400);
    await request(server).get('/observations?dogId=pas-un-uuid').set(as('alice')).expect(400);
  });

  it('isolates users from each other', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/dogs/${dogId}/events`).set(as('bob')).send({ behavior: 'Aboyer' }).expect(404);
    const listed = await request(server).get('/observations').set(as('bob')).expect(200);
    expect(listed.body.total).toBe(0);
  });

  it('deletes an observation', async () => {
    const server = app.getHttpServer();
    const created = await request(server).post(`/dogs/${dogId}/events`).set(as('alice')).send({ behavior: 'Sauter' }).expect(201);
    await request(server).delete(`/observations/${created.body.id}`).set(as('bob')).expect(404);
    await request(server).delete(`/observations/${created.body.id}`).set(as('alice')).expect(204);
  });
});
