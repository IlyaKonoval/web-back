import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthService } from '../auth.service';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { SessionContainer } from 'supertokens-node/recipe/session';

interface RequestWithSession extends Request {
  session?: SessionContainer;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithSession>();

    if (!req.session || typeof req.session.getUserId !== 'function') {
      return false;
    }

    const userId = req.session.getUserId();

    if (!userId) {
      return false;
    }

    if (requiredRoles.includes(Role.ADMIN)) {
      return await this.authService.isAdmin(userId);
    }

    return true;
  }
}
