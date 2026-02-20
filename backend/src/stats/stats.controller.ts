import { Controller, Get, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { StatsQuery } from './stats.dto';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  summary(@CurrentUser() user: User, @Query() query: StatsQuery) {
    return this.statsService.summary(user.id, query);
  }
}
