import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TokenVerifier } from './token-verifier';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: User;
}

/** Requires a valid Keycloak access token on every route that is not @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: TokenVerifier,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton d\'accès manquant');
    }

    try {
      const identity = await this.tokenVerifier.verify(header.slice('Bearer '.length));
      request.user = await this.usersService.findOrCreate(identity);
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
    return true;
  }
}
