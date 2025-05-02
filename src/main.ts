import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as expressLayouts from 'express-ejs-layouts';
import { ValidationPipe } from '@nestjs/common';
import * as methodOverride from 'method-override';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './users/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedHeaders: ['content-type'],
    credentials: true,
  });

  app.use(cookieParser());
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.user = req.user;
    next();
  });

  const staticAssetsPath = join(__dirname, '..', 'public');
  app.useStaticAssets(staticAssetsPath);
  console.log('Static assets directory:', staticAssetsPath);

  app.setBaseViewsDir(join(__dirname, 'views'));
  app.use(expressLayouts);
  app.setViewEngine('ejs');

  app.use(methodOverride('_method'));

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API для тестирования ручек')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  try {
    await app.listen(3000);
    console.log('Приложение запущено на порту 3000');
    console.log('Swagger UI доступен по адресу http://localhost:3000/api');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        'Не удалось запустить приложение:',
        error.message,
        error.stack,
      );
    } else {
      console.error(
        'Не удалось запустить приложение: Произошла неизвестная ошибка',
        error,
      );
    }
  }
}

bootstrap();
