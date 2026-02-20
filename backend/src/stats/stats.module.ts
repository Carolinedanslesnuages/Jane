import { Module } from '@nestjs/common';
import { ObservationsModule } from '../observations/observations.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [ObservationsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
