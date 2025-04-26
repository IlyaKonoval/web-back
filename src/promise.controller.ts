import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiExcludeController()
@Controller('promise')
export class PromiseController {
  @Public()
  @Get('')
  @Render('promise')
  promise(@Req() req: Request) {
    const isAuthenticated = !!req.session;
    console.log('isAuthenticated:', isAuthenticated);

    return {
      title: 'Promise',
      bodyClass: 'promise-body',
      mainClass: 'promise-main',
      isAuthenticated: isAuthenticated,
    };
  }
}
