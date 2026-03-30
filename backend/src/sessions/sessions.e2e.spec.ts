import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('sessions (HTTP)', () => {
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

  it('runs a whole session and shows what was observed during it', async () => {
    const server = app.getHttpServer();
    const started = await request(server)
      .post(`/animals/${animalId}/sessions`)
      .set(as('alice'))
      .send({ method: 'FOCAL', observerName: 'Marie' })
      .expect(201);
    expect(started.body).toMatchObject({ method: 'FOCAL', observerName: 'Marie', endedAt: null });
    await request(server).post(`/animals/${animalId}/sessions`).set(as('alice')).send({}).expect(409);

    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Aboyer' }).expect(201);
    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Courir' }).expect(201);

    const ended = await request(server).post(`/sessions/${started.body.id}/end`).set(as('alice')).send({ notes: 'Calme' }).expect(200);
    expect(ended.body.endedAt).not.toBeNull();

    const listed = await request(server).get(`/sessions?animalId=${animalId}`).set(as('alice')).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ id: started.body.id, observationCount: 2, notes: 'Calme' });
    const detail = await request(server).get(`/sessions/${started.body.id}`).set(as('alice')).expect(200);
    expect(detail.body.observationCount).toBe(2);
  });

  it("uses the account name when no observer is given, and refuses someone else's animal", async () => {
    const server = app.getHttpServer();
    const other = (await request(server).post('/animals').set(as('bob')).send({ name: 'Luna' })).body.id;
    const started = await request(server).post(`/animals/${other}/sessions`).set(as('bob')).send({}).expect(201);
    expect(started.body.observerName).toBe('bob@jane.test');
    await request(server).post(`/animals/${other}/sessions`).set(as('alice')).send({}).expect(404);
    await request(server).post(`/sessions/${started.body.id}/end`).set(as('alice')).send({}).expect(404);
  });

  it('validates the body and deletes a session without deleting its observations', async () => {
    const server = app.getHttpServer();
    const animal = (await request(server).post('/animals').set(as('carol')).send({ name: 'Mistigri', species: 'CAT' })).body.id;
    await request(server).post(`/animals/${animal}/sessions`).set(as('carol')).send({ method: 'INCONNUE' }).expect(400);
    const session = (await request(server).post(`/animals/${animal}/sessions`).set(as('carol')).send({})).body;
    await request(server).post(`/animals/${animal}/events`).set(as('carol')).send({ behavior: 'Ronronner' }).expect(201);
    await request(server).delete(`/sessions/${session.id}`).set(as('carol')).expect(204);
    const observations = await request(server).get(`/observations?animalId=${animal}`).set(as('carol')).expect(200);
    expect(observations.body.total).toBe(1);
    expect(observations.body.items[0].sessionId).toBeNull();
  });
});
