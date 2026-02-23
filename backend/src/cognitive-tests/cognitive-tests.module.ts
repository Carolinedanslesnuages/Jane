import { Module } from '@nestjs/common';
import { AnimalsModule } from '../animals/animals.module';
import { CognitiveTestsController } from './cognitive-tests.controller';
import { CognitiveTestsService } from './cognitive-tests.service';

@Module({
  imports: [AnimalsModule],
  controllers: [CognitiveTestsController],
  providers: [CognitiveTestsService],
  exports: [CognitiveTestsService],
})
export class CognitiveTestsModule {}
