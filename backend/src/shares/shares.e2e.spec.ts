import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('sharing an animal (HTTP)', () => {
  let app: INestApplication;
  let animalId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const server = app.getHttpServer();
    // An account exists once its owner has signed in.
    await request(server).get('/me').set(as('bob')).expect(200);
    await request(server).get('/me').set(as('carol')).expect(200);
    animalId = (await request(server).post('/animals').set(as('alice')).send({ name: 'Rex' }).expect(201)).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('shares with another account, which then sees the animal and its role', async () => {
    const server = app.getHttpServer();
    expect((await request(server).get('/animals').set(as('bob')).expect(200)).body).toEqual([]);

    const shared = await request(server).post(`/animals/${animalId}/shares`).set(as('alice')).send({ email: 'bob@jane.test', role: 'VIEWER' }).expect(201);
    expect(shared.body).toMatchObject({ role: 'VIEWER', email: 'bob@jane.test' });

    const seen = await request(server).get('/animals').set(as('bob')).expect(200);
    expect(seen.body).toHaveLength(1);
    expect(seen.body[0]).toMatchObject({ name: 'Rex', role: 'VIEWER', ownerName: 'alice@jane.test' });
    const mine = await request(server).get('/animals').set(as('alice')).expect(200);
    expect(mine.body[0]).toMatchObject({ role: 'OWNER', ownerName: null });
  });

  it('keeps sharing, editing and deleting for the owner', async () => {
    const server = app.getHttpServer();
    await request(server).patch(`/animals/${animalId}`).set(as('bob')).send({ name: 'Max' }).expect(404);
    await request(server).delete(`/animals/${animalId}`).set(as('bob')).expect(404);
    await request(server).get(`/animals/${animalId}/shares`).set(as('bob')).expect(403);
    await request(server).post(`/animals/${animalId}/shares`).set(as('bob')).send({ email: 'carol@jane.test', role: 'VIEWER' }).expect(403);
    await request(server).get(`/animals/${animalId}/shares`).set(as('carol')).expect(404);
  });

  it('validates the request and explains an unknown address', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/shares`).set(as('alice')).send({ email: 'pas-une-adresse', role: 'VIEWER' }).expect(400);
    await request(server).post(`/animals/${animalId}/shares`).set(as('alice')).send({ email: 'bob@jane.test', role: 'ADMIN' }).expect(400);
    const unknown = await request(server).post(`/animals/${animalId}/shares`).set(as('alice')).send({ email: 'nobody@jane.test', role: 'VIEWER' }).expect(404);
    expect(unknown.body.message).toContain('doit s\'être connectée');
  });

  it('lets the owner withdraw a share and the person leave it', async () => {
    const server = app.getHttpServer();
    const shares = (await request(server).get(`/animals/${animalId}/shares`).set(as('alice')).expect(200)).body;
    expect(shares).toHaveLength(1);
    await request(server).delete(`/animals/${animalId}/shares/${shares[0].id}`).set(as('carol')).expect(404);
    await request(server).delete(`/animals/${animalId}/shares/${shares[0].id}`).set(as('bob')).expect(204);
    expect((await request(server).get('/animals').set(as('bob')).expect(200)).body).toEqual([]);
  });
});
