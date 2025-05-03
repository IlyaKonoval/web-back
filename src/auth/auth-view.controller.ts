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
import { Response, Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from './interfaces/user.interface';

// Extend the Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user: User;
  cookies: {
    [key: string]: string;
  };
}

// Define custom error type for proper type checking
interface ErrorWithMessage {
  message: string;
}

// Type guard to check if an error has a message property
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

@ApiExcludeController()
@Controller('auth')
export class AuthViewController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('login')
  @Render('auth/login')
  loginForm(@Req() req: Request) {
    return {
      title: 'Войти в аккаунт',
      errorMessage: null,
      formData: {},
      query: req.query,
      currentPath: req.path,
      bodyClass: 'login-page',
      mainClass: 'login-main',
    };
  }

  @Public()
  @Get('signin')
  @Render('auth/login')
  signinForm(@Req() req: Request) {
    return {
      title: 'Войти в аккаунт',
      errorMessage: null,
      formData: {},
      query: req.query,
      currentPath: req.path,
      bodyClass: 'login-page',
      mainClass: 'login-main',
    };
  }

  // Добавляем маршрут для /auth/signup
  @Public()
  @Get('signup')
  @Render('auth/register')
  signupForm() {
    return {
      title: 'Регистрация',
      errorMessage: null,
      formData: {},
      currentPath: '/auth/signup',
      bodyClass: 'register-page',
      mainClass: 'register-main',
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.validateUser(
        body.email,
        body.password,
      );
      if (!user) {
        return res.render('auth/login', {
          title: 'Войти в аккаунт',
          errorMessage: 'Неверный email или пароль',
          formData: { email: body.email },
          currentPath: '/auth/login',
          bodyClass: 'login-page',
          mainClass: 'login-main',
        });
      }

      const accessToken = this.authService.login(user);
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error: unknown) {
      console.error('Login error:', error);
      return res.render('auth/login', {
        title: 'Войти в аккаунт',
        errorMessage: 'Ошибка входа. Попробуйте позже.',
        formData: { email: body.email },
        currentPath: '/auth/login',
        bodyClass: 'login-page',
        mainClass: 'login-main',
      });
    }
  }

  @Public()
  @Post('guest-login')
  async guestLogin(@Res() res: Response) {
    try {
      const guestUser = await this.authService.createGuestUser();
      const accessToken = this.authService.login(guestUser);
      const refreshToken = await this.authService.generateRefreshToken(
        guestUser.id,
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error: unknown) {
      console.error('Guest login error:', error);
      return res.render('auth/login', {
        title: 'Войти в аккаунт',
        errorMessage: 'Ошибка входа как гость. Попробуйте позже.',
        formData: {},
        currentPath: '/auth/login',
        bodyClass: 'login-page',
        mainClass: 'login-main',
      });
    }
  }

  @Public()
  @Get('register')
  @Render('auth/register')
  registerForm() {
    return {
      title: 'Регистрация',
      errorMessage: null,
      formData: {},
      currentPath: '/auth/register',
      bodyClass: 'register-page',
      mainClass: 'register-main',
    };
  }

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    },
    @Res() res: Response,
  ) {
    try {
      if (body.password !== body.confirmPassword) {
        return res.render('auth/register', {
          title: 'Регистрация',
          errorMessage: 'Пароли не совпадают',
          formData: { username: body.username, email: body.email },
          currentPath: '/auth/register',
          bodyClass: 'register-page',
          mainClass: 'register-main',
        });
      }

      const user = await this.authService.register({
        username: body.username,
        email: body.email,
        password: body.password,
        confirmPassword: body.confirmPassword,
      });

      const accessToken = this.authService.login(user);
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      let errorMessage = 'Ошибка регистрации. Попробуйте позже.';

      if (isErrorWithMessage(error) && error.message.includes('exists')) {
        errorMessage = 'Пользователь с таким email уже существует';
      }

      return res.render('auth/register', {
        title: 'Регистрация',
        errorMessage: errorMessage,
        formData: { username: body.username, email: body.email },
        currentPath: '/auth/register',
        bodyClass: 'register-page',
        mainClass: 'register-main',
      });
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies['refresh_token'] as string | undefined;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.redirect('/');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return res.redirect('/');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('auth/profile')
  profile(@Req() req: AuthenticatedRequest) {
    return {
      title: 'Профиль пользователя',
      user: req.user,
      errorMessage: null,
      currentPath: '/auth/profile',
      bodyClass: 'profile-page',
      mainClass: 'profile-main',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('change-password')
  @Render('auth/change-password')
  changePasswordForm(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    if (req.user.isGuest) {
      return res.redirect('/auth/profile');
    }

    return {
      title: 'Изменение пароля',
      errorMessage: null,
      successMessage: null,
      currentPath: '/auth/change-password',
      bodyClass: 'change-password-page',
      mainClass: 'change-password-main',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    @Res() res: Response,
  ) {
    if (req.user.isGuest) {
      return res.redirect('/auth/profile');
    }

    try {
      if (body.newPassword !== body.confirmPassword) {
        return res.render('auth/change-password', {
          title: 'Изменение пароля',
          errorMessage: 'Новые пароли не совпадают',
          successMessage: null,
          currentPath: '/auth/change-password',
          bodyClass: 'change-password-page',
          mainClass: 'change-password-main',
        });
      }

      await this.authService.changePassword(req.user.id, {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      const accessToken = this.authService.login(req.user);
      const refreshToken = await this.authService.generateRefreshToken(
        req.user.id,
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.render('auth/change-password', {
        title: 'Изменение пароля',
        errorMessage: null,
        successMessage: 'Пароль успешно изменен',
        currentPath: '/auth/change-password',
        bodyClass: 'change-password-page',
        mainClass: 'change-password-main',
      });
    } catch (error: unknown) {
      console.error('Change password error:', error);
      let errorMessage = 'Ошибка изменения пароля.';

      if (isErrorWithMessage(error) && error.message.includes('incorrect')) {
        errorMessage = 'Текущий пароль указан неверно';
      }

      return res.render('auth/change-password', {
        title: 'Изменение пароля',
        errorMessage: errorMessage,
        successMessage: null,
        currentPath: '/auth/change-password',
        bodyClass: 'change-password-page',
        mainClass: 'change-password-main',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      await this.authService.deleteUser(req.user.id);

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.redirect('/');
    } catch (error: unknown) {
      console.error('Delete account error:', error);
      return res.render('auth/profile', {
        title: 'Профиль пользователя',
        user: req.user,
        errorMessage: 'Ошибка удаления аккаунта',
        currentPath: '/auth/profile',
        bodyClass: 'profile-page',
        mainClass: 'profile-main',
      });
    }
  }
}
