import { Controller, Get, Render, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('promise')
export class PromiseController {
  @Get('')
  @Render('promise')
  promise(@Query('isAuthenticated') isAuthenticated: string) {
    console.log('isAuthenticated:', isAuthenticated);
    return {
      title: 'Promise',
      bodyClass: 'promise-body',
      mainClass: 'promise-main',
      isAuthenticated: isAuthenticated === 'true',
    };
  }

  @Get('/auth')
  auth(@Res() res: Response) {
    res.redirect('/promise?isAuthenticated=true');
  }

  @Get('/logout')
  logout(@Res() res: Response) {
    res.redirect('/promise?isAuthenticated=false');
  }
}
