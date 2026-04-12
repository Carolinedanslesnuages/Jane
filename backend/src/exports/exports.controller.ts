import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExportQuery, ReportQuery } from './exports.dto';
import { ExportsService } from './exports.service';

/** Exports are costly (a whole history, a PDF): 20 a minute is plenty for a person. */
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('observations.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="jane-observations.csv"')
  observationsCsv(@CurrentUser() user: User, @Query() query: ExportQuery) {
    return this.exportsService.observationsCsv(user.id, query);
  }

  @Get('report.pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="jane-bilan-comportemental.pdf"')
  async report(@CurrentUser() user: User, @Query() query: ReportQuery) {
    return new StreamableFile(await this.exportsService.report(user.id, query));
  }
}
