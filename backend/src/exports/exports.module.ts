import { Module } from '@nestjs/common';
import { CognitiveTestsModule } from '../cognitive-tests/cognitive-tests.module';
import { DogsModule } from '../dogs/dogs.module';
import { ObservationsModule } from '../observations/observations.module';
import { StatsModule } from '../stats/stats.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [DogsModule, ObservationsModule, StatsModule, CognitiveTestsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
