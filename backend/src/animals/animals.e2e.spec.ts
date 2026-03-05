import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/test-app';

describe('/animals (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('requires a token', async () => {
    await request(app.getHttpServer()).get('/animals').expect(401);
    await request(app.getHttpServer()).get('/animals').set(as('invalid')).expect(401);
  });

  it('keeps /health public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('creates, reads, updates and deletes an animal', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/animals')
      .set(as('alice'))
      .send({ name: 'Rex', breed: 'Border Collie', birthDate: '2023-05-10', sex: 'MALE' })
      .expect(201);
    const animalId = created.body.id;

    const listed = await request(server).get('/animals').set(as('alice')).expect(200);
    expect(listed.body).toHaveLength(1);

    await request(server).patch(`/animals/${animalId}`).set(as('alice')).send({ neutered: true }).expect(200);
    const fetched = await request(server).get(`/animals/${animalId}`).set(as('alice')).expect(200);
    expect(fetched.body.neutered).toBe(true);

    await request(server).get(`/animals/${animalId}`).set(as('bob')).expect(404);
    await request(server).delete(`/animals/${animalId}`).set(as('alice')).expect(204);
    await request(server).get(`/animals/${animalId}`).set(as('alice')).expect(404);
  });

  it('validates the body', async () => {
    const server = app.getHttpServer();
    await request(server).post('/animals').set(as('alice')).send({}).expect(400);
    await request(server).post('/animals').set(as('alice')).send({ name: 'Rex', unknown: 1 }).expect(400);
    await request(server).post('/animals').set(as('alice')).send({ name: 'Rex', birthDate: 'hier' }).expect(400);
  });

  it('stores the species and refuses an unknown one', async () => {
    const server = app.getHttpServer();
    const created = await request(server).post('/animals').set(as('dave')).send({ name: 'Mistigri', species: 'CAT' }).expect(201);
    expect(created.body.species).toBe('CAT');
    const defaulted = await request(server).post('/animals').set(as('dave')).send({ name: 'Rex' }).expect(201);
    expect(defaulted.body.species).toBe('DOG');
    await request(server).post('/animals').set(as('dave')).send({ name: 'Smaug', species: 'DRAGON' }).expect(400);
    await request(server).patch(`/animals/${created.body.id}`).set(as('dave')).send({ species: 'OTHER' }).expect(200);
  });

  it('lists the animals of one species', async () => {
    const server = app.getHttpServer();
    await request(server).post('/animals').set(as('frank')).send({ name: 'Rex' }).expect(201);
    await request(server).post('/animals').set(as('frank')).send({ name: 'Mistigri', species: 'CAT' }).expect(201);
    await request(server).post('/animals').set(as('frank')).send({ name: 'Felix', species: 'CAT' }).expect(201);
    const cats = await request(server).get('/animals?species=CAT').set(as('frank')).expect(200);
    expect(cats.body.map((animal: { name: string }) => animal.name)).toEqual(['Felix', 'Mistigri']);
    const all = await request(server).get('/animals').set(as('frank')).expect(200);
    expect(all.body).toHaveLength(3);
    await request(server).get('/animals?species=DRAGON').set(as('frank')).expect(400);
  });

  it('answers 409 on a duplicate name', async () => {
    const server = app.getHttpServer();
    await request(server).post('/animals').set(as('carol')).send({ name: 'Luna' }).expect(201);
    await request(server).post('/animals').set(as('carol')).send({ name: 'Luna' }).expect(409);
  });
});
