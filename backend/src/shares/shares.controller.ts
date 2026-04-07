import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { ShareAnimalDto } from './share.dto';
import { SharesService } from './shares.service';

@Controller('animals/:animalId/shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  share(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: ShareAnimalDto) {
    return this.sharesService.share(user.id, animalId, body);
  }

  @Get()
  list(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string) {
    return this.sharesService.list(user.id, animalId);
  }

  @Delete(':shareId')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: User,
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ) {
    await this.sharesService.remove(user.id, animalId, shareId);
  }
}
