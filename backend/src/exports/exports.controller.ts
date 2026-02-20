import { Controller, Get, Header, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExportQuery } from './exports.dto';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('observations.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="jane-observations.csv"')
  observationsCsv(@CurrentUser() user: User, @Query() query: ExportQuery) {
    return this.exportsService.observationsCsv(user.id, query);
  }
}
