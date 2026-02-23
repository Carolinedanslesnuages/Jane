import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('GET /stats/summary (HTTP)', () => {
  let app: INestApplication;
  let animalId: string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const period = 'from=2020-01-01T00:00:00Z&to=2099-01-01T00:00:00Z';

  beforeAll(async () => {
    ({ app } = await createTestApp());
    const server = app.getHttpServer();
    animalId = (await request(server).post('/animals').set(as('alice')).send({ name: 'Rex' })).body.id;
    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Aboyer', stimuli: 'Bruit' });
    await request(server).post(`/animals/${animalId}/events`).set(as('alice')).send({ behavior: 'Courir' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('summarises the observations of the period', async () => {
    const response = await request(app.getHttpServer()).get(`/stats/summary?animalId=${animalId}&${period}`).set(as('alice')).expect(200);
    expect(response.body.totals).toMatchObject({ observations: 2, stressCount: 1, measuredSeconds: 0 });
    expect(response.body.timeBudget).toHaveLength(6);
    expect(response.body.stress.byBehavior).toEqual([{ label: 'Aboyer', count: 1 }]);
    expect(response.body.timeline).toHaveLength(2);
  });

  it('only sees the data of the signed-in user', async () => {
    const response = await request(app.getHttpServer()).get(`/stats/summary?${period}`).set(as('bob')).expect(200);
    expect(response.body.totals.observations).toBe(0);
  });

  it('requires a period and a known time zone', async () => {
    const server = app.getHttpServer();
    await request(server).get('/stats/summary').set(as('alice')).expect(400);
    await request(server).get(`/stats/summary?${period}&timezone=Mars/Olympus`).set(as('alice')).expect(400);
    await request(server).get(`/stats/summary?${period}&timezone=Europe/Paris`).set(as('alice')).expect(200);
  });
});
