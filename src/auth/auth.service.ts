import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserRolesRecipe from 'supertokens-node/recipe/userroles';
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
      // Проверяем, существует ли пользователь в БД
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      // Обновленный вызов signUp
      const superTokensResponse = await EmailPassword.signUp(
        'public',
        email,
        password,
      );

      if (superTokensResponse.status === 'OK') {
        const user = await this.prisma.user.create({
          data: {
            email,
            username,
            password: 'MANAGED_BY_SUPERTOKENS',
            role: Role.USER,
          },
        });

        try {
          await UserRolesRecipe.addRoleToUser(
            'public',
            superTokensResponse.user.id,
            'user' as any,
          );
          await UserRolesRecipe.addRoleToUser(
            'public',
            user.email,
            'admin' as any,
          );

          await UserRolesRecipe.addRoleToUser(
            'public',
            superTokensResponse.user.id,
            'user',
          );
        } catch (roleError) {
          console.error('Error setting up user roles:', roleError);
        }

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
      // Обновленный вызов signIn
      const signInResponse = await EmailPassword.signIn(
        'public',
        email,
        password,
      );

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
      // Безопасный вызов API для получения ролей
      const rolesResponse = await UserRolesRecipe.getRolesForUser(
        'public',
        userId,
      );

      // Проверяем наличие свойства roles в ответе
      if (
        rolesResponse &&
        typeof rolesResponse === 'object' &&
        'roles' in rolesResponse
      ) {
        const roles = rolesResponse.roles;
        if (Array.isArray(roles)) {
          return roles;
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      // Самый надежный способ проверки роли - получить все роли и проверить наличие нужной
      const roles = await this.getUserRoles(userId);
      return roles.includes(role.toLowerCase());
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
        // Исправлено: передаем роль как строку
        await UserRolesRecipe.addRoleToUser('public', user.email, 'admin');
      } catch (e) {
        console.error('Could not update role in SuperTokens', e);
        // Продолжаем выполнение, даже если обновление роли в SuperTokens не удалось
      }

      return true;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      throw error;
    }
  }
}
