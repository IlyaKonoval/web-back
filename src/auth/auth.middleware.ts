import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const refreshTokens = async (refreshToken: string) => {
      try {
        const tokens = await this.authService.refreshTokens(refreshToken);

        res.cookie('access_token', tokens.access_token, {
          httpOnly: true,
          maxAge: 15 * 60 * 1000, // 15 минут
        });

        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        });

        return tokens.access_token;
      } catch (error) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return null;
      }
    };

    const accessToken = req.cookies['access_token'];
    const refreshToken = req.cookies['refresh_token'];

    if (!accessToken && !refreshToken) {
      return next();
    }

    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken);

        // Получаем пользователя и добавляем в request
        const user = await this.authService.getUserById(payload.sub);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (error) {
        if (refreshToken) {
          const newAccessToken = await refreshTokens(refreshToken);
          if (newAccessToken) {
            try {
              const payload = this.jwtService.verify(newAccessToken);
              const user = await this.authService.getUserById(payload.sub);
              if (user) {
                req.user = user;
                return next();
              }
            } catch {}
          }
        }
      }
    }

    if (!req.user && refreshToken) {
      const newAccessToken = await refreshTokens(refreshToken);
      if (newAccessToken) {
        try {
          const payload = this.jwtService.verify(newAccessToken);
          const user = await this.authService.getUserById(payload.sub);
          if (user) {
            req.user = user;
            return next();
          }
        } catch {}
      }
    }

    next();
  }
}
