import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { User } from '@prisma/client';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: RequestWithSession, res: Response, next: NextFunction) {
    try {
      if (req.session) {
        const userId = req.session.getUserId();
        if (userId) {
          const user = await this.authService.getCurrentUser(userId);

          // Расширяем тип для res.locals
          interface ResponseLocals extends Record<string, unknown> {
            user?: Partial<User>;
          }

          (res.locals as ResponseLocals).user = user as Partial<User>;
        }
      }
    } catch (error) {
      console.error(
        'Error in UserMiddleware:',
        error instanceof Error ? error.message : String(error),
      );
    }
    next();
  }
}
