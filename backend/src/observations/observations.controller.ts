import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListObservationsQuery, RecordEventDto, StartStateDto, StopStateDto } from './observation.dto';
import { ObservationsService } from './observations.service';

@Controller()
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post('animals/:animalId/events')
  recordEvent(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: RecordEventDto) {
    return this.observationsService.recordEvent(user.id, animalId, body);
  }

  @Get('animals/:animalId/active-states')
  listActiveStates(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string) {
    return this.observationsService.listActiveStates(user.id, animalId);
  }

  @Post('animals/:animalId/states/start')
  startState(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: StartStateDto) {
    return this.observationsService.startState(user.id, animalId, body.behavior);
  }

  @Post('animals/:animalId/states/stop')
  @HttpCode(200)
  stopState(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: StopStateDto) {
    return this.observationsService.stopState(user.id, animalId, body);
  }

  @Get('observations')
  list(@CurrentUser() user: User, @Query() query: ListObservationsQuery) {
    return this.observationsService.list(user.id, query);
  }

  @Delete('observations/:observationId')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('observationId', ParseUUIDPipe) observationId: string) {
    await this.observationsService.remove(user.id, observationId);
  }
}
