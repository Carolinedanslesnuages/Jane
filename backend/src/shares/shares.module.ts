import { Module } from '@nestjs/common';
import { AnimalsModule } from '../animals/animals.module';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';

@Module({
  imports: [AnimalsModule],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
