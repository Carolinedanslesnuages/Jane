import { Module } from '@nestjs/common';
import { DogsModule } from '../dogs/dogs.module';
import { ObservationsModule } from '../observations/observations.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [DogsModule, ObservationsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
