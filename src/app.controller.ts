import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator'; // Убедитесь, что импорт корректный

@ApiExcludeController()
@Controller()
export class AppController {
  @Public() // Добавить этот декоратор
  @Get('/')
  @Render('index')
  root() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

  @Public() // Добавить этот декоратор
  @Get('/index')
  @Render('index')
  index() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

  @Public()
  @Get('/portfolio')
  @Render('portfolio')
  portfolio() {
    return {
      title: 'Portfolio',
      bodyClass: 'portfolio-body',
      mainClass: 'portfolio-main',
    };
  }
}
