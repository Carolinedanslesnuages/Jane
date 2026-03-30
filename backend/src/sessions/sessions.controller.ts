import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { EndSessionDto, ListSessionsQuery, StartSessionDto } from './session.dto';
import { SessionsService } from './sessions.service';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('animals/:animalId/sessions')
  start(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: StartSessionDto) {
    return this.sessionsService.start(user.id, animalId, body, user.displayName || user.email || 'Observateur');
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(200)
  end(@CurrentUser() user: User, @Param('sessionId', ParseUUIDPipe) sessionId: string, @Body() body: EndSessionDto) {
    return this.sessionsService.end(user.id, sessionId, body);
  }

  @Get('sessions')
  list(@CurrentUser() user: User, @Query() query: ListSessionsQuery) {
    return this.sessionsService.list(user.id, query);
  }

  @Get('sessions/:sessionId')
  findOne(@CurrentUser() user: User, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessionsService.findOne(user.id, sessionId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    await this.sessionsService.remove(user.id, sessionId);
  }
}
