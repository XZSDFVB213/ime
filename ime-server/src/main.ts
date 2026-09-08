import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: 'http://localhost:4200',

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

    credentials: true,
  });

  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
}

bootstrap();
