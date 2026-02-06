import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS')?.split(',') ?? [],
    credentials: true,
  });

  const port = config.get<number>('API_PORT') ?? 3000;
  await app.listen(port);

  console.log(`🚀 REVO API running on http://localhost:${port}/api/v1`);
}

bootstrap();
