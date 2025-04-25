import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from './decorators/public.decorator';
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('auth')
export class AuthViewController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('signin')
  @Render('auth/login')
  loginForm() {
    return {
      title: 'Вход в аккаунт',
      bodyClass: 'bg-gray-100',
      mainClass: 'container mx-auto py-8',
      errorMessage: null,
    };
  }

  @Public()
  @Get('signup')
  @Render('auth/register')
  registerForm() {
    return {
      title: 'Регистрация аккаунта',
      bodyClass: 'bg-gray-100',
      mainClass: 'container mx-auto py-8',
      errorMessage: null,
    };
  }

  @Public()
  @Post('signup')
  async register(@Body() signupDto: SignupDto, @Res() res: Response) {
    try {
      await this.authService.signup(
        signupDto.email,
        signupDto.password,
        signupDto.username,
      );
      return res.redirect('/auth/signin?registered=true');
    } catch (error) {
      return res.render('auth/register', {
        title: 'Регистрация аккаунта',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        errorMessage: error.message,
        formData: {
          username: signupDto.username,
          email: signupDto.email,
        },
      });
    }
  }

  @Public()
  @Post('signin')
  async login(@Body() signinDto: SigninDto, @Res() res: Response) {
    try {
      const user = await this.authService.signin(
        signinDto.email,
        signinDto.password,
      );

      if (user) {
        return res.redirect('/');
      } else {
        return res.render('auth/login', {
          title: 'Вход в аккаунт',
          bodyClass: 'bg-gray-100',
          mainClass: 'container mx-auto py-8',
          errorMessage: 'Неверный email или пароль',
          formData: {
            email: signinDto.email,
          },
        });
      }
    } catch (error) {
      return res.render('auth/login', {
        title: 'Вход в аккаунт',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        errorMessage: error.message,
        formData: {
          email: signinDto.email,
        },
      });
    }
  }

  @Get('signout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      if (req.session) {
        await this.authService.signout(req.session.getHandle());
      }
      return res.redirect('/');
    } catch (error) {
      console.error('Error during logout:', error);
      return res.redirect('/');
    }
  }
}
