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
        });
      }

      const accessToken = await this.authService.login(user);
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      // Установка токенов в cookies
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      return res.render('auth/login', {
        title: 'Войти в аккаунт',
        errorMessage: 'Ошибка входа. Попробуйте позже.',
        formData: { email: body.email },
        currentPath: '/auth/login',
      });
    }
  }

  @Public()
  @Post('guest-login')
  async guestLogin(@Res() res: Response) {
    try {
      const guestUser = await this.authService.createGuestUser();
      const accessToken = await this.authService.login(guestUser);
      const refreshToken = await this.authService.generateRefreshToken(
        guestUser.id,
      );

      // Установка токенов в cookies
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error) {
      console.error('Guest login error:', error);
      return res.render('auth/login', {
        title: 'Войти в аккаунт',
        errorMessage: 'Ошибка входа как гость. Попробуйте позже.',
        formData: {},
        currentPath: '/auth/login',
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
      // Проверка, совпадают ли пароли
      if (body.password !== body.confirmPassword) {
        return res.render('auth/register', {
          title: 'Регистрация',
          errorMessage: 'Пароли не совпадают',
          formData: { username: body.username, email: body.email },
          currentPath: '/auth/register',
        });
      }

      // Создание пользователя
      const user = await this.authService.register({
        username: body.username,
        email: body.email,
        password: body.password,
      });

      const accessToken = await this.authService.login(user);
      const refreshToken = await this.authService.generateRefreshToken(user.id);

      // Установка токенов в cookies
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 минут
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      return res.redirect('/');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Ошибка регистрации. Попробуйте позже.';

      if (error.message && error.message.includes('exists')) {
        errorMessage = 'Пользователь с таким email уже существует';
      }

      return res.render('auth/register', {
        title: 'Регистрация',
        errorMessage: errorMessage,
        formData: { username: body.username, email: body.email },
        currentPath: '/auth/register',
      });
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      // Получаем refresh token из cookies
      const refreshToken = req.cookies['refresh_token'];
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Очищаем cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.redirect('/');
    } catch (error) {
      console.error('Logout error:', error);
      return res.redirect('/');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('auth/profile')
  async profile(@Req() req: Request) {
    return {
      title: 'Профиль пользователя',
      user: req.user,
      errorMessage: null,
      currentPath: '/auth/profile',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('change-password')
  @Render('auth/change-password')
  changePasswordForm(@Req() req: Request) {
    if (req.user.isGuest) {
      return res.redirect('/auth/profile');
    }

    return {
      title: 'Изменение пароля',
      errorMessage: null,
      successMessage: null,
      currentPath: '/auth/change-password',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
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
        });
      }

      await this.authService.changePassword(req.user.id, {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      const accessToken = await this.authService.login(req.user);
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
      });
    } catch (error) {
      console.error('Change password error:', error);
      let errorMessage = 'Ошибка изменения пароля.';

      if (error.message && error.message.includes('incorrect')) {
        errorMessage = 'Текущий пароль указан неверно';
      }

      return res.render('auth/change-password', {
        title: 'Изменение пароля',
        errorMessage: errorMessage,
        successMessage: null,
        currentPath: '/auth/change-password',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(@Req() req: Request, @Res() res: Response) {
    try {
      await this.authService.deleteUser(req.user.id);

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.redirect('/');
    } catch (error) {
      console.error('Delete account error:', error);
      return res.render('auth/profile', {
        title: 'Профиль пользователя',
        user: req.user,
        errorMessage: 'Ошибка удаления аккаунта',
        currentPath: '/auth/profile',
      });
    }
  }
}
