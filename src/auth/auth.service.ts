import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User, JwtPayload } from './interfaces/user.interface';
import { RegisterDto, UserResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_EXPIRES_HOURS: number;
  private readonly SALT_ROUNDS: number = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.REFRESH_TOKEN_EXPIRES_HOURS = configService.get(
      'REFRESH_TOKEN_EXPIRES_HOURS',
      24 * 7,
    );
  }

  async createGuestUser(): Promise<User> {
    const randomId = Math.random().toString(36).slice(2, 11);
    const guestEmail = `guest_${randomId}@example.com`;
    const randomPassword = Math.random().toString(36).slice(2, 12);

    const hashedPassword = await bcrypt.hash(randomPassword, this.SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: guestEmail,
        password: hashedPassword,
        username: `Guest_${randomId.substring(0, 5)}`,
        isGuest: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        registrationDate: true,
        isGuest: true,
      },
    }) as unknown as User;
  }

  async generateRefreshToken(userId: number): Promise<string> {
    try {
      // Получаем пользователя для создания payload
      const user = await this.getUserById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Создаем payload для refresh токена
      const payload: JwtPayload = {
        sub: userId,
        email: user.email,
        isGuest: user.isGuest || false,
        role: user.role,
        type: 'refresh', // Добавляем тип для различения токенов
      };

      // Генерируем JWT с более долгим сроком действия
      const refreshToken = this.jwtService.sign(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
      });

      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + this.REFRESH_TOKEN_EXPIRES_HOURS,
      );

      // Сохраняем токен в базу данных (по-прежнему необходимо для отзыва)
      await this.prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt,
        },
      });

      return refreshToken;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create refresh token: ${errorMessage}`);
      throw new InternalServerErrorException(
        'Failed to generate refresh token',
      );
    }
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          role: true,
          registrationDate: true,
          isGuest: true,
        },
      });

      if (!user) return null;

      const isPasswordValid = await bcrypt.compare(pass, user.password);
      if (!isPasswordValid) return null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as unknown as User;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error validating user: ${errorMessage}`);
      return null;
    }
  }

  login(user: User): string {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      isGuest: user.isGuest || false,
      role: user.role,
      type: 'access', // Добавляем тип для различения токенов
    };

    return this.jwtService.sign(payload);
  }

  async register(userData: RegisterDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(
        userData.password,
        this.SALT_ROUNDS,
      );

      const newUser = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          username: userData.username,
          isGuest: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          registrationDate: true,
          isGuest: true,
        },
      });

      return newUser as unknown as UserResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const prismaError = error as { code?: string };
      if (
        typeof error === 'object' &&
        error !== null &&
        prismaError.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error registering user: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Сначала проверяем, существует ли токен в базе данных
      const tokenData = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenData) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (tokenData.expiresAt < new Date()) {
        await this.prisma.refreshToken.delete({ where: { id: tokenData.id } });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Проверяем сам JWT токен
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const payload = this.jwtService.verify(refreshToken, {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            this.configService.get<string>('JWT_SECRET'),
        }); // Добавляем приведение типа

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (payload.type !== 'refresh') {
          throw new UnauthorizedException('Invalid token type');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (payload.sub !== tokenData.userId) {
          throw new UnauthorizedException('Token user mismatch');
        }
      } catch (
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        _jwtVerifyError
      ) {
        await this.prisma.refreshToken.delete({ where: { id: tokenData.id } });
        throw new UnauthorizedException('Invalid refresh token signature');
      }

      // Удаляем старый токен
      await this.prisma.refreshToken.delete({ where: { id: tokenData.id } });

      const user = {
        id: tokenData.user.id,
        email: tokenData.user.email,
        username: tokenData.user.username,
        role: tokenData.user.role,
        isGuest: tokenData.user.isGuest,
      } as User;

      // Создаем новые токены
      const newRefreshToken = await this.generateRefreshToken(tokenData.userId);
      const accessToken = this.login(user);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error refreshing tokens: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to refresh tokens');
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });

      await this.prisma.user.delete({
        where: { id: userId },
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting user: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      // При использовании JWT также можно проверять валидность самого токена
      try {
        this.jwtService.verify(refreshToken, {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            this.configService.get<string>('JWT_SECRET'),
        });
      } catch (
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        _jwtVerifyError
      ) {
        // Если токен невалиден с точки зрения JWT, считаем операцию успешной
        return true;
      }

      // Удаление из базы данных
      const result = await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });

      return result.count > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error during logout: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          registrationDate: true,
          isGuest: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error finding user by ID: ${errorMessage}`);
      return null;
    }
  }

  async changePassword(
    userId: number,
    passwordData: { currentPassword: string; newPassword: string },
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        passwordData.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        passwordData.newPassword,
        this.SALT_ROUNDS,
      );

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error changing password: ${errorMessage}`);
      throw error;
    }
  }

  // Добавляем метод getAllUsers для GraphQL резолвера
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          registrationDate: true,
          isGuest: true,
        },
      });

      return users.map((user) => ({
        ...user,
        isGuest: user.isGuest ?? false,
      })) as User[];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching all users: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }
}
