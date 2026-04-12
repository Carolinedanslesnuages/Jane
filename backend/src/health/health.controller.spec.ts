import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

function createController(queryRaw: jest.Mock) {
  return new HealthController({ $queryRaw: queryRaw } as never);
}

describe('HealthController', () => {
  it('reports the API and its database as up', async () => {
    await expect(createController(jest.fn().mockResolvedValue([{ '?column?': 1 }])).check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('answers 503 when the database cannot be reached', async () => {
    const controller = createController(jest.fn().mockRejectedValue(new Error('connexion refusée')));
    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
    await expect(controller.check()).rejects.toMatchObject({ response: { status: 'error', database: 'down' } });
  });

  it('has a liveness route that does not touch the database', () => {
    const queryRaw = jest.fn();
    expect(createController(queryRaw).live()).toEqual({ status: 'ok' });
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
