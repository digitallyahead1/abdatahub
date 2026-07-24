import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like native mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const isAllowed =
        origin === 'https://abdatahub.com' ||
        origin === 'https://www.abdatahub.com' ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // Fallback: allow all origins to prevent mobile web CORS blockage
        callback(null, true);
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AB Data Hub API')
    .setDescription('Premium VTU & Fintech Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

bootstrap();
