import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { User, JwtPayload } from './interfaces/user.interface';
import { ConfigService } from '@nestjs/config';
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
    });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.REFRESH_TOKEN_EXPIRES_HOURS);

    try {
      await this.prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt,
        },
      });

      return refreshToken;
    } catch (error) {
      this.logger.error(`Failed to create refresh token: ${error.message}`);
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

      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`);
      return null;
    }
  }

  async login(user: User): Promise<string> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      isGuest: user.isGuest || false,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async register(userData: RegisterDto): Promise<UserResponseDto> {
    try {
      // Check if user already exists
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

      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error registering user: ${error.message}`);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
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

      // Delete the used refresh token
      await this.prisma.refreshToken.delete({ where: { id: tokenData.id } });

      // Generate new tokens
      const user = {
        id: tokenData.user.id,
        email: tokenData.user.email,
        username: tokenData.user.username,
        role: tokenData.user.role,
        isGuest: tokenData.user.isGuest,
      };

      const newRefreshToken = await this.generateRefreshToken(tokenData.userId);
      const accessToken = await this.login(user);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error refreshing tokens: ${error.message}`);
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
      this.logger.error(`Error deleting user: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      return this.prisma.user.findUnique({
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
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error.message}`);
      return null;
    }
  }
}
