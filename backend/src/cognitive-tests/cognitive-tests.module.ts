import { Module } from '@nestjs/common';
import { DogsModule } from '../dogs/dogs.module';
import { CognitiveTestsController } from './cognitive-tests.controller';
import { CognitiveTestsService } from './cognitive-tests.service';

@Module({
  imports: [DogsModule],
  controllers: [CognitiveTestsController],
  providers: [CognitiveTestsService],
  exports: [CognitiveTestsService],
})
export class CognitiveTestsModule {}
