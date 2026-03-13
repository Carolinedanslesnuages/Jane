import { Module } from '@nestjs/common';
import { KeycloakModule } from '../keycloak/keycloak.module';
import { MeController } from './me.controller';
import { UsersService } from './users.service';

@Module({
  imports: [KeycloakModule],
  controllers: [MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
