import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('observations (HTTP)', () => {
  let app: INestApplication;
  let animalId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const created = await request(app.getHttpServer()).post('/animals').set(as('alice')).send({ name: 'Rex' });
    animalId = created.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('records an event then lists it', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Aboyer', stimuli: 'Bruit' }).expect(201);
    const listed = await request(server).get(`/observations?animalId=${animalId}`).set(as('alice')).expect(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.items[0]).toMatchObject({ behavior: 'Aboyer', category: 'STRESS', type: 'EVENT' });
  });

  it('runs a full state cycle', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/states/start`).set(as('alice')).send({ behavior: 'Dormir' }).expect(201);
    await request(server).post(`/animals/${animalId}/states/start`).set(as('alice')).send({ behavior: 'Dormir' }).expect(409);
    const running = await request(server).get(`/animals/${animalId}/active-states`).set(as('alice')).expect(200);
    expect(running.body).toHaveLength(1);
    const stopped = await request(server).post(`/animals/${animalId}/states/stop`).set(as('alice')).send({ behavior: 'Dormir' }).expect(200);
    expect(stopped.body).toMatchObject({ type: 'STATE', category: 'REST' });
    await request(server).post(`/animals/${animalId}/states/stop`).set(as('alice')).send({ behavior: 'Dormir' }).expect(404);
  });

  it('records events and elapsed states after the fact', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/animals/${animalId}/events`)
      .set(as('alice'))
      .send({ behavior: 'Courir', occurredAt: '2026-01-15T10:00:00Z' })
      .expect(201);
    const logged = await request(server)
      .post(`/animals/${animalId}/states/log`)
      .set(as('alice'))
      .send({ behavior: 'Dormir', startedAt: '2026-01-15T12:00:00Z', endedAt: '2026-01-15T13:00:00Z' })
      .expect(201);
    expect(logged.body).toMatchObject({ type: 'STATE', durationSeconds: 3600 });
    const listed = await request(server)
      .get(`/observations?animalId=${animalId}&from=2026-01-15T00:00:00Z&to=2026-01-15T23:59:59Z`)
      .set(as('alice'))
      .expect(200);
    expect(listed.body.total).toBe(2);
    await request(server)
      .post(`/animals/${animalId}/states/log`)
      .set(as('alice'))
      .send({ behavior: 'Dormir', startedAt: '2026-01-15T13:00:00Z', endedAt: '2026-01-15T12:00:00Z' })
      .expect(400);
  });

  it('rejects unknown behaviours and bad queries', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Voler' }).expect(400);
    await request(server).get('/observations?limit=0').set(as('alice')).expect(400);
    await request(server).get('/observations?animalId=pas-un-uuid').set(as('alice')).expect(400);
  });

  it('isolates users from each other', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/events`).set(as('bob')).send({ behavior: 'Aboyer' }).expect(404);
    const listed = await request(server).get('/observations').set(as('bob')).expect(200);
    expect(listed.body.total).toBe(0);
  });

  it('deletes an observation', async () => {
    const server = app.getHttpServer();
    const created = await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Sauter' }).expect(201);
    await request(server).delete(`/observations/${created.body.id}`).set(as('bob')).expect(404);
    await request(server).delete(`/observations/${created.body.id}`).set(as('alice')).expect(204);
  });
});
