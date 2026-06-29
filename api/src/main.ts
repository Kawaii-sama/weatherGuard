import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

// TEMPORARY DIAGNOSTIC — catches anything that slips past Nest's own
// exception filter entirely and prints the real error instead of the
// request just silently dying with no log output at all.
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔴 UNHANDLED REJECTION:', reason);
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService<AppConfig, true>);

  app.enableCors({
    origin: configService.get('frontendUrl', { infer: true }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WeatherGuard Admin API')
    .setDescription(
      'Invite-only weather alert service — social-login + admin approval workflow + Telegram bot delivery.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = configService.get('port', { infer: true });
  await app.listen(port);

  logger.log(`🌤️  WeatherGuard API listening on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();