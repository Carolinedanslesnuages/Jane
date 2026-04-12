import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** The API is up and can reach its database; answers 503 otherwise, so a supervisor can restart or route around it. */
  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up' };
  }

  /** The process answers: nothing else is checked (a database outage must not make a supervisor kill the API). */
  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }
}
