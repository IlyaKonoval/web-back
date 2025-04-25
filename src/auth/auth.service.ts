import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AuthModuleConfig } from './auth.module';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    @Inject('AUTH_CONFIG') private config: AuthModuleConfig,
  ) {}

  async signup(
    email: string,
    password: string,
    username: string,
  ): Promise<Partial<User>> {
    try {
      // First check if the user already exists in our database
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      const superTokensResponse = await EmailPassword.signUp({
        email,
        password,
        tenantId: 'public',
      });

      if (superTokensResponse.status === 'OK') {
        // Create user in our database
        const user = await this.prisma.user.create({
          data: {
            email,
            username,
            password: 'MANAGED_BY_SUPERTOKENS', // We don't store actual passwords
            role: Role.USER,
          },
        });

        // Set the user role in SuperTokens
        await UserRoles.createNewRoleOrAddPermissions('public', 'user', []);
        await UserRoles.createNewRoleOrAddPermissions('public', 'admin', []);

        // Fixed: Correct method call with all required parameters
        await UserRoles.addRoleToUser(
          'public',
          superTokensResponse.user.id,
          'user',
        );

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        };
      }

      throw new Error('Ошибка при регистрации в сервисе аутентификации');
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  }

  async signin(email: string, password: string): Promise<Partial<User> | null> {
    try {
      const signInResponse = await EmailPassword.signIn({
        email,
        password,
        tenantId: 'public', // Required third argument
      });

      if (signInResponse.status === 'OK') {
        const user = await this.prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        });

        return user;
      }

      return null;
    } catch (error) {
      console.error('Error during signin:', error);
      throw error;
    }
  }

  async signout(sessionHandle: string): Promise<boolean> {
    try {
      await Session.revokeSession(sessionHandle);
      return true;
    } catch (error) {
      console.error('Error during signout:', error);
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<Partial<User> | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: userId,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const roles = await UserRoles.getRolesForUser('public', userId);
      return roles.roles;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      return await UserRoles.doesUserHaveRole(
        'public',
        userId,
        role.toLowerCase(),
      );
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: userId,
        },
      });

      return user?.role === Role.ADMIN;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async promoteToAdmin(userId: number): Promise<boolean> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.ADMIN },
      });

      try {
        await UserRoles.addRoleToUser('public', user.email, 'admin');
      } catch (e) {
        console.error('Could not update role in SuperTokens', e);
      }

      return true;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      throw error;
    }
  }
}
