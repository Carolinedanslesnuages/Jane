import { Controller, Get, Query } from '@nestjs/common';
import { Species } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { Public } from '../auth/public.decorator';
import { ethogramFor } from './ethogram';

export class EthogramQuery {
  /** Espèce dont on veut l'éthogramme ; chien par défaut. */
  @IsOptional()
  @IsEnum(Species)
  species?: Species;
}

@Controller('ethogram')
export class EthogramController {
  @Public()
  @Get()
  list(@Query() query: EthogramQuery) {
    return ethogramFor(query.species ?? 'DOG');
  }
}
