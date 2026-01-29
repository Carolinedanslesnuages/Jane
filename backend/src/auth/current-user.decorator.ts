import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthenticatedRequest } from './auth.guard';

/** Injects the local user resolved from the access token. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user as User;
});
