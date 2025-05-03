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
import { Request, Response, NextFunction } from 'express';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  isGuest?: boolean;
  [key: string]: any;
}

interface RequestWithUser extends Request {
  user?: User;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Настройки для обработки статических файлов и шаблонов должны быть перед другими middleware
  const staticAssetsPath = join(__dirname, '..', 'public');
  app.useStaticAssets(staticAssetsPath);
  console.log('Static assets directory:', staticAssetsPath);

  app.setBaseViewsDir(join(__dirname, 'views'));
  app.use(expressLayouts);
  app.setViewEngine('ejs');

  // Парсер для cookies
  app.use(cookieParser());

  // Middleware для method-override
  app.use(methodOverride('_method'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Настройка CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedHeaders: ['content-type'],
    credentials: true,
  });

  // Middleware для добавления локальных переменных в шаблоны
  app.use((req: RequestWithUser, res: Response, next: NextFunction) => {
    const typedRes = res as Response & {
      locals: {
        currentPath?: string;
        user?: User;
        bodyClass?: string;
        mainClass?: string;
        [key: string]: unknown;
      };
    };

    typedRes.locals.currentPath = req.path;

    if (req.user) {
      typedRes.locals.user = req.user;
    }

    typedRes.locals.bodyClass =
      (typedRes.locals.bodyClass as string) || 'default-body';
    typedRes.locals.mainClass =
      (typedRes.locals.mainClass as string) || 'default-main';

    next();
  });

  // Настройка и подключение Swagger
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
