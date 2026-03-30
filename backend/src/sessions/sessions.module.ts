import { Module } from '@nestjs/common';
import { AnimalsModule } from '../animals/animals.module';
import { ObservationsModule } from '../observations/observations.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AnimalsModule, ObservationsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
