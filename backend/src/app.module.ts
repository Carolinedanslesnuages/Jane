import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { AuthModule } from './auth/auth.module';
import { DogsModule } from './dogs/dogs.module';
import { EthogramController } from './ethogram/ethogram.controller';
import { ObservationsModule } from './observations/observations.module';
import { CognitiveTestsModule } from './cognitive-tests/cognitive-tests.module';
import { StatsModule } from './stats/stats.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: (raw) => {
        validateEnvironment(raw);
        return raw;
      },
    }),
    PrismaModule,
    AuthModule,
    DogsModule,
    ObservationsModule,
    CognitiveTestsModule,
    StatsModule,
  ],
  controllers: [HealthController, EthogramController],
})
export class AppModule {}
