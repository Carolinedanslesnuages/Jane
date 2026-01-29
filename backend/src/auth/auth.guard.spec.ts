import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

const user = { id: 'local-1', keycloakSubject: 'kc-1' };

function createContext(headers: Record<string, string> = {}) {
  const request: { headers: Record<string, string>; user?: unknown } = { headers };
  const context = {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function createGuard(options: { isPublic?: boolean; verify?: jest.Mock } = {}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => (key === IS_PUBLIC_KEY ? options.isPublic : undefined)),
  } as unknown as Reflector;
  const verify = options.verify ?? jest.fn().mockResolvedValue({ subject: 'kc-1' });
  const findOrCreate = jest.fn().mockResolvedValue(user);
  const guard = new AuthGuard(reflector, { verify } as never, { findOrCreate } as never);
  return { guard, verify, findOrCreate };
}

describe('AuthGuard', () => {
  it('lets public routes through without a token', async () => {
    const { guard, verify } = createGuard({ isPublic: true });
    await expect(guard.canActivate(createContext().context)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a request without a bearer token', async () => {
    const { guard } = createGuard();
    await expect(guard.canActivate(createContext().context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token the verifier refuses', async () => {
    const { guard } = createGuard({ verify: jest.fn().mockRejectedValue(new Error('expired')) });
    const { context } = createContext({ authorization: 'Bearer bad' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the local user to the request', async () => {
    const { guard, verify, findOrCreate } = createGuard();
    const { context, request } = createContext({ authorization: 'Bearer good' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('good');
    expect(findOrCreate).toHaveBeenCalledWith({ subject: 'kc-1' });
    expect(request.user).toBe(user);
  });
});
