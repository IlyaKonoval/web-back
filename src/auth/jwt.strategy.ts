import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User, JwtPayload } from './interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // Проверяем тип токена - должен быть access
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        registrationDate: true,
        isGuest: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Обеспечиваем, что isGuest всегда является булевым значением
    const userWithDefaultValues: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as User['role'], // More type-safe assertion
      registrationDate: user.registrationDate,
      isGuest: user.isGuest ?? false,
    };

    return userWithDefaultValues;
  }
}
