import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateDogDto } from './dog.dto';
import { DogsService } from './dogs.service';
import { UpdateDogDto } from './update-dog.dto';

@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.dogsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateDogDto) {
    return this.dogsService.create(user.id, body);
  }

  @Get(':dogId')
  findOne(@CurrentUser() user: User, @Param('dogId', ParseUUIDPipe) dogId: string) {
    return this.dogsService.findOne(user.id, dogId);
  }

  @Patch(':dogId')
  update(@CurrentUser() user: User, @Param('dogId', ParseUUIDPipe) dogId: string, @Body() body: UpdateDogDto) {
    return this.dogsService.update(user.id, dogId, body);
  }

  @Delete(':dogId')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('dogId', ParseUUIDPipe) dogId: string) {
    await this.dogsService.remove(user.id, dogId);
  }
}
