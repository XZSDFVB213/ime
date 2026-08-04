import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*', // Разрешить запросы только с этого домена
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Разрешённые HTTP-методы
    allowedHeaders: ['Content-Type', 'Authorization'], // Разрешённые заголовки
    credentials: true, // Разрешить отправку учётных данных (куки, токены авторизации)
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
