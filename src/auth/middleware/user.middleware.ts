import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { User } from '@prisma/client';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

interface ResponseLocals extends Record<string, unknown> {
  user?: Partial<User> & { supertokensRoles?: string[] };
  isAuthenticated?: boolean;
}

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: RequestWithSession, res: Response, next: NextFunction) {
    try {
      const locals = res.locals as ResponseLocals;

      if (req.session) {
        const userId = req.session.getUserId();
        if (userId) {
          const user = await this.authService.getCurrentUser(userId);
          const roles = await this.authService.getUserRoles(userId);

          const enhancedUser = {
            ...user,
            supertokensRoles: roles,
          };

          locals.user = enhancedUser;
          locals.isAuthenticated = true;
        } else {
          locals.isAuthenticated = false;
        }
      } else {
        locals.isAuthenticated = false;
      }
    } catch (error) {
      console.error(
        'Error in UserMiddleware:',
        error instanceof Error ? error.message : String(error),
      );

      const locals = res.locals as ResponseLocals;
      locals.isAuthenticated = false;
    }
    next();
  }
}
