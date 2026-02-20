import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('GET /exports/observations.csv (HTTP)', () => {
  let app: INestApplication;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const server = app.getHttpServer();
    const dogId = (await request(server).post('/dogs').set(as('alice')).send({ name: '=Rex' })).body.id;
    await request(server).post(`/dogs/${dogId}/events`).set(as('alice')).send({ behavior: 'Aboyer', notes: 'chez le voisin, tard', stimuli: 'Bruit' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('downloads a CSV with the observations', async () => {
    const response = await request(app.getHttpServer()).get('/exports/observations.csv').set(as('alice')).expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('date,chien,comportement,categorie,type,debut,duree_secondes,lieu,meteo,stimuli,notes');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("'=Rex,Aboyer,Stress,evenement");
    expect(lines[1]).toContain('"chez le voisin, tard"');
  });

  it('contains nothing for another user', async () => {
    const response = await request(app.getHttpServer()).get('/exports/observations.csv').set(as('bob')).expect(200);
    expect(response.text.replace('﻿', '').trim().split('\r\n')).toHaveLength(1);
  });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/exports/observations.csv').expect(401);
  });
});
