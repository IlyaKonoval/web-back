import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from './interfaces/user.interface';

interface JwtPayload {
  sub: number;
  email: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends Request {
  user?: User;
  cookies: {
    [key: string]: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const refreshTokens = async (refreshToken: string) => {
      try {
        const tokens = await this.authService.refreshTokens(refreshToken);

        res.cookie('access_token', tokens.access_token, {
          httpOnly: true,
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return tokens.access_token;
      } catch (err) {
        console.error('Error refreshing tokens:', err);

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
        // Use JwtPayload type for proper type safety
        const payload = this.jwtService.verify(accessToken) as JwtPayload;

        const user = await this.authService.getUserById(payload.sub);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        console.error('Access token verification failed:', err);

        if (refreshToken) {
          const newAccessToken = await refreshTokens(refreshToken);
          if (newAccessToken) {
            try {
              // Use JwtPayload type here too
              const payload = this.jwtService.verify(newAccessToken) as JwtPayload;
              const user = await this.authService.getUserById(payload.sub);
              if (user) {
                req.user = user;
                return next();
              }
            } catch (tokenErr) {
              console.error('New access token verification failed:', tokenErr);
            }
          }
        }
      }
    }

    if (!req.user && refreshToken) {
      const newAccessToken = await refreshTokens(refreshToken);
      if (newAccessToken) {
        try {
          const payload = this.jwtService.verify(newAccessToken) as JwtPayload;
          const user = await this.authService.getUserById(payload.sub);
          if (user) {
            req.user = user;
            return next();
          }
        } catch (err) {
          console.error('Refresh token verification failed:', err);
        }
      }
    }

    next();
  }
}