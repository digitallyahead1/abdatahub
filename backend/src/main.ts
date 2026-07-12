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
  const isDev = process.env.NODE_ENV !== 'production';
  let corsOrigins: string | string[] | RegExp | RegExp[] | boolean;

  if (isDev) {
    // In development allow ALL localhost/127.0.0.1 origins (any port)
    // so Flutter Web, Next.js, Swagger UI etc. work on dynamic ports
    corsOrigins = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  } else {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    corsOrigins = corsOrigin.includes(',')
      ? corsOrigin.split(',').map((o) => o.trim())
      : corsOrigin;
  }

  app.enableCors({
    origin: corsOrigins,
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
