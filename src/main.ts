// Application bootstrap — configures global middleware, pipes, CORS and Swagger,
// then starts listening on the configured port.

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe:
  //   whitelist: strip properties not declared in DTOs
  //   forbidNonWhitelisted: false — lenient (don't throw on extra fields)
  //   transform: auto-convert query params to declared types (e.g. "5" → 5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Uniform JSON error responses for all thrown exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  // All routes are prefixed with /api (e.g. GET /api/providers)
  app.setGlobalPrefix('api');

  // CORS — allow the Next.js frontend to call the API from the browser
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger UI at /api/docs — useful during development and for API consumers
  const config = new DocumentBuilder()
    .setTitle('UrbanFix API')
    .setDescription('Home services marketplace REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`UrbanFix API running at http://localhost:${port}/api`);
  console.log(`Swagger docs      at http://localhost:${port}/api/docs`);
}

bootstrap();
