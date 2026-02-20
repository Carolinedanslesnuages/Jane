import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ethogramFor } from './ethogram';

@Controller('ethogram')
export class EthogramController {
  @Public()
  @Get()
  list() {
    return ethogramFor('DOG');
  }
}
