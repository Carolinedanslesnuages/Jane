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

describe('working together on a shared animal (HTTP)', () => {
  let app: INestApplication;
  let animalId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const period = 'from=2020-01-01T00:00:00Z&to=2099-01-01T00:00:00Z';

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const server = app.getHttpServer();
    await request(server).get('/me').set(as('observer')).expect(200);
    await request(server).get('/me').set(as('viewer')).expect(200);
    animalId = (await request(server).post('/animals').set(as('owner')).send({ name: 'Rex' }).expect(201)).body.id;
    await request(server).post(`/animals/${animalId}/shares`).set(as('owner')).send({ email: 'observer@jane.test', role: 'OBSERVER' }).expect(201);
    await request(server).post(`/animals/${animalId}/shares`).set(as('owner')).send({ email: 'viewer@jane.test', role: 'VIEWER' }).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets the observer record, the owner and the viewer read it, and the export tell who recorded', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/events`).set(as('observer')).send({ behavior: 'Aboyer' }).expect(201);
    await request(server).post(`/animals/${animalId}/events`).set(as('owner')).send({ behavior: 'Courir' }).expect(201);

    for (const token of ['owner', 'observer', 'viewer']) {
      const listed = await request(server).get(`/observations?animalId=${animalId}`).set(as(token)).expect(200);
      expect(listed.body.total).toBe(2);
      const stats = await request(server).get(`/stats/summary?animalId=${animalId}&${period}`).set(as(token)).expect(200);
      expect(stats.body.totals.observations).toBe(2);
    }
    const csv = await request(server).get(`/exports/observations.csv?animalId=${animalId}`).set(as('viewer')).expect(200);
    const rows = csv.text.replace('﻿', '').trim().split('\r\n').slice(1);
    expect(rows.some((row) => row.includes(',Aboyer,') && row.endsWith(',observer@jane.test'))).toBe(true);
    expect(rows.some((row) => row.includes(',Courir,') && row.endsWith(',owner@jane.test'))).toBe(true);
  });

  it('stops the viewer from changing anything, with an explanation', async () => {
    const server = app.getHttpServer();
    const refused = await request(server).post(`/animals/${animalId}/events`).set(as('viewer')).send({ behavior: 'Aboyer' }).expect(403);
    expect(refused.body.message).toContain('pas le droit');
    await request(server).post(`/animals/${animalId}/states/start`).set(as('viewer')).send({ behavior: 'Dormir' }).expect(403);
    await request(server).post(`/animals/${animalId}/sessions`).set(as('viewer')).send({}).expect(403);
    await request(server).post(`/animals/${animalId}/cognitive-tests`).set(as('viewer')).send({ testType: 'DETOUR', durationSeconds: 5 }).expect(403);
    const observations = (await request(server).get(`/observations?animalId=${animalId}`).set(as('viewer'))).body.items;
    await request(server).delete(`/observations/${observations[0].id}`).set(as('viewer')).expect(403);
  });

  it('lets the observer run sessions and tests, and the viewer download the report', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/animals/${animalId}/sessions`).set(as('observer')).send({ method: 'FOCAL' }).expect(201);
    await request(server).post(`/animals/${animalId}/cognitive-tests`).set(as('observer')).send({ testType: 'DETOUR', durationSeconds: 9 }).expect(201);
    const sessions = await request(server).get(`/sessions?animalId=${animalId}`).set(as('viewer')).expect(200);
    expect(sessions.body).toHaveLength(1);
    await request(server).get(`/exports/report.pdf?animalId=${animalId}&${period}`).set(as('viewer')).expect(200);
  });
});
