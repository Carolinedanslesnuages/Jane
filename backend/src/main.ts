import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Behind the reverse proxy (Caddy) the client address is in X-Forwarded-For: rate limiting needs it.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  configureApp(app);
  const documentation = new DocumentBuilder()
    .setTitle('API Jane')
    .setDescription("Carnet d'observation du comportement animal")
    .setVersion('2.2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, documentation));

  const config = app.get(ConfigService);
  await app.listen(config.get<number>('API_PORT') ?? 3300);
}

bootstrap();
