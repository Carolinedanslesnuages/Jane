import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListCognitiveTestsQuery, RecordCognitiveTestDto, UpdateCognitiveTestDto } from './cognitive-test.dto';
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

  @Patch('cognitive-tests/:testId')
  update(@CurrentUser() user: User, @Param('testId', ParseUUIDPipe) testId: string, @Body() body: UpdateCognitiveTestDto) {
    return this.cognitiveTestsService.update(user.id, testId, body);
  }

  @Delete('cognitive-tests/:testId')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('testId', ParseUUIDPipe) testId: string) {
    await this.cognitiveTestsService.remove(user.id, testId);
  }
}
