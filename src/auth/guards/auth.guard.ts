import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { Request, Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();
    let authorized = false;

    await new Promise<void>((resolve) => {
      const middleware = verifySession({
        sessionRequired: true,
      });

      middleware(req, res, () => {
        authorized = true;
        resolve();
      });

      res.on('close', () => {
        if (!authorized) {
          resolve();
        }
      });
    });

    if (!authorized) {
      // Проверяем, является ли запрос API запросом или запросом страницы
      const isApiRequest = req.path.startsWith('/api/');

      if (isApiRequest) {
        throw new UnauthorizedException('unauthorised');
      } else {
        res.redirect('/auth/signin');
        return false;
      }
    }

    return authorized;
  }
}
