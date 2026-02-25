import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('observing several species (HTTP)', () => {
  let app: INestApplication;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('follows a cat and a horse, each with its own behaviours', async () => {
    const server = app.getHttpServer();
    const cat = (await request(server).post('/animals').set(as('eve')).send({ name: 'Mistigri', species: 'CAT' }).expect(201)).body;
    const horse = (await request(server).post('/animals').set(as('eve')).send({ name: 'Éclair', species: 'HORSE' }).expect(201)).body;

    await request(server).post(`/animals/${cat.id}/events`).set(as('eve')).send({ behavior: 'Ronronner' }).expect(201);
    await request(server).post(`/animals/${cat.id}/events`).set(as('eve')).send({ behavior: 'Piaffer' }).expect(400);
    await request(server).post(`/animals/${horse.id}/events`).set(as('eve')).send({ behavior: 'Piaffer' }).expect(201);
    await request(server).post(`/animals/${horse.id}/states/start`).set(as('eve')).send({ behavior: 'Dormir debout' }).expect(201);
    await request(server).post(`/animals/${horse.id}/states/start`).set(as('eve')).send({ behavior: 'Ronronner' }).expect(400);
  });

  it('exports the species with the observations', async () => {
    const response = await request(app.getHttpServer()).get('/exports/observations.csv').set(as('eve')).expect(200);
    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines.some((line) => line.includes(',Mistigri,Chat,Ronronner,'))).toBe(true);
    expect(lines.some((line) => line.includes(',Éclair,Cheval,Piaffer,'))).toBe(true);
  });

  it('puts the species in the statistics of the right animal only', async () => {
    const server = app.getHttpServer();
    const animals = (await request(server).get('/animals').set(as('eve')).expect(200)).body;
    const cat = animals.find((entry: { name: string }) => entry.name === 'Mistigri');
    const period = 'from=2020-01-01T00:00:00Z&to=2099-01-01T00:00:00Z';
    const stats = await request(server).get(`/stats/summary?animalId=${cat.id}&${period}`).set(as('eve')).expect(200);
    expect(stats.body.totals.observations).toBe(1);
    expect(stats.body.stress.total).toBe(0);
  });
});
