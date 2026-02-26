import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateAnimalDto, ListAnimalsQuery } from './animal.dto';
import { AnimalsService } from './animals.service';
import { UpdateAnimalDto } from './update-animal.dto';

@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListAnimalsQuery) {
    return this.animalsService.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateAnimalDto) {
    return this.animalsService.create(user.id, body);
  }

  @Get(':animalId')
  findOne(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string) {
    return this.animalsService.findOne(user.id, animalId);
  }

  @Patch(':animalId')
  update(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string, @Body() body: UpdateAnimalDto) {
    return this.animalsService.update(user.id, animalId, body);
  }

  @Delete(':animalId')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('animalId', ParseUUIDPipe) animalId: string) {
    await this.animalsService.remove(user.id, animalId);
  }
}
