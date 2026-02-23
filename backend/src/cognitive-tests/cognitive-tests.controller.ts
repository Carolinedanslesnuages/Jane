import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListCognitiveTestsQuery, RecordCognitiveTestDto } from './cognitive-test.dto';
import { CognitiveTestsService } from './cognitive-tests.service';

@Controller()
export class CognitiveTestsController {
  constructor(private readonly cognitiveTestsService: CognitiveTestsService) {}

  @Post('animals/:animalId/cognitive-tests')
  record(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: RecordCognitiveTestDto) {
    return this.cognitiveTestsService.record(user.id, animalId, body);
  }

  @Get('cognitive-tests')
  list(@CurrentUser() user: User, @Query() query: ListCognitiveTestsQuery) {
    return this.cognitiveTestsService.list(user.id, query);
  }
}
