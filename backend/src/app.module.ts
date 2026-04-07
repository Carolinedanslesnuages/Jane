import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { AuthModule } from './auth/auth.module';
import { AnimalsModule } from './animals/animals.module';
import { EthogramController } from './ethogram/ethogram.controller';
import { ObservationsModule } from './observations/observations.module';
import { CognitiveTestsModule } from './cognitive-tests/cognitive-tests.module';
import { SessionsModule } from './sessions/sessions.module';
import { SharesModule } from './shares/shares.module';
import { StatsModule } from './stats/stats.module';
import { ExportsModule } from './exports/exports.module';
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
    AnimalsModule,
    ObservationsModule,
    CognitiveTestsModule,
    SessionsModule,
    SharesModule,
    StatsModule,
    ExportsModule,
  ],
  controllers: [HealthController, EthogramController],
})
export class AppModule {}
