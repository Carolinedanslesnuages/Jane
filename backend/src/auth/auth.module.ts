import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { TokenVerifier } from './token-verifier';

@Module({
  imports: [UsersModule],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    {
      provide: TokenVerifier,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        TokenVerifier.forRealm(
          String(config.get('KEYCLOAK_URL')).replace(/\/$/, ''),
          String(config.get('KEYCLOAK_REALM')),
          config.get<string>('KEYCLOAK_API_CLIENT_ID') ?? 'jane-api',
        ),
    },
  ],
  exports: [TokenVerifier],
})
export class AuthModule {}
