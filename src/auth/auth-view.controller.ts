import { Controller, Get, Post, Body, Render, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from './decorators/public.decorator';
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionContainer } from 'supertokens-node/recipe/session';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

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
      const errorMessage =
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка';

      return res.render('auth/register', {
        title: 'Регистрация аккаунта',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        errorMessage,
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
      const errorMessage =
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка';

      return res.render('auth/login', {
        title: 'Вход в аккаунт',
        bodyClass: 'bg-gray-100',
        mainClass: 'container mx-auto py-8',
        errorMessage,
        formData: {
          email: signinDto.email,
        },
      });
    }
  }

  @Get('signout')
  async logout(@Req() req: RequestWithSession, @Res() res: Response) {
    try {
      if (req.session && typeof req.session.getHandle === 'function') {
        const sessionHandle = req.session.getHandle();
        await this.authService.signout(sessionHandle);
      }
      return res.redirect('/');
    } catch (error) {
      console.error(
        'Error during logout:',
        error instanceof Error ? error.message : error,
      );
      return res.redirect('/');
    }
  }
}
