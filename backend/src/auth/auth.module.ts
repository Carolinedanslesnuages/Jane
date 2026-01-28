import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenVerifier } from './token-verifier';

@Module({
  providers: [
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
