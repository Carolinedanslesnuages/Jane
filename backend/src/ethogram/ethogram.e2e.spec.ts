import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('GET /ethogram (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const behaviorsOf = (body: { behaviors: string[] }[]) => body.flatMap((entry) => entry.behaviors);

  it('is public and describes the dog by default', async () => {
    const response = await request(app.getHttpServer()).get('/ethogram').expect(200);
    expect(response.body).toHaveLength(6);
    expect(behaviorsOf(response.body)).toContain('Aboyer');
  });

  it('serves the ethogram of the requested species', async () => {
    const cat = await request(app.getHttpServer()).get('/ethogram?species=CAT').expect(200);
    expect(behaviorsOf(cat.body)).toContain('Ronronner');
    expect(behaviorsOf(cat.body)).not.toContain('Aboyer');
    const horse = await request(app.getHttpServer()).get('/ethogram?species=HORSE').expect(200);
    expect(behaviorsOf(horse.body)).toContain('Piaffer');
  });

  it('rejects an unknown species', async () => {
    await request(app.getHttpServer()).get('/ethogram?species=DRAGON').expect(400);
  });
});
