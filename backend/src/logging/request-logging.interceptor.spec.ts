import { CallHandler, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

function createContext(request: object, response: object = { statusCode: 200 }) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ExecutionContext;
}

describe('RequestLoggingInterceptor', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('logs method, path, status, duration and account, as one JSON line', async () => {
    const request = { method: 'GET', originalUrl: '/animals', url: '/animals', user: { id: 'u1' } };
    await lastValueFrom(new RequestLoggingInterceptor().intercept(createContext(request), { handle: () => of('ok') } as CallHandler));
    const entry = JSON.parse(log.mock.calls[0][0]);
    expect(entry).toMatchObject({ method: 'GET', path: '/animals', status: 200, userId: 'u1' });
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('never logs the query string', async () => {
    const request = { method: 'POST', originalUrl: '/animals/a1/shares?email=paul@jane.test', url: '/x' };
    await lastValueFrom(new RequestLoggingInterceptor().intercept(createContext(request), { handle: () => of(null) } as CallHandler));
    const line = log.mock.calls[0][0] as string;
    expect(line).not.toContain('paul@jane.test');
    expect(JSON.parse(line).path).toBe('/animals/a1/shares');
    expect(JSON.parse(line).userId).toBeNull();
  });

  it('warns on a refusal and errors on a failure', async () => {
    const request = { method: 'DELETE', originalUrl: '/animals/a1', url: '/animals/a1' };
    const interceptor = new RequestLoggingInterceptor();
    await expect(
      lastValueFrom(interceptor.intercept(createContext(request), { handle: () => throwError(() => new ForbiddenException()) } as CallHandler)),
    ).rejects.toThrow();
    expect(JSON.parse(warn.mock.calls[0][0]).status).toBe(403);

    await expect(
      lastValueFrom(interceptor.intercept(createContext(request), { handle: () => throwError(() => new Error('boom')) } as CallHandler)),
    ).rejects.toThrow('boom');
    expect(JSON.parse(error.mock.calls[0][0]).status).toBe(500);
  });
});
