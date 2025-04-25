import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get('/')
  @Render('index')
  root() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

  @Get('/index')
  @Render('index')
  index() {
    return {
      title: 'Personal Portfolio Website',
      bodyClass: 'index-body',
      mainClass: 'index-main',
    };
  }

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
