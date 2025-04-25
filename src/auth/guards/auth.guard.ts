import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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

    return authorized;
  }
}
