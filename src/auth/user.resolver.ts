import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';

@Resolver('User')
export class UserResolver {
  constructor(private authService: AuthService) {}

  @Public()
  @Mutation('login')
  async login(@Args('loginInput') loginInput: LoginDto) {
    const user = await this.authService.validateUser(
      loginInput.email,
      loginInput.password,
    );
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const accessToken = await this.authService.login(user);
    const refreshToken = await this.authService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  @Public()
  @Mutation('register')
  async register(@Args('registerInput') registerInput: RegisterDto) {
    const user = await this.authService.register(registerInput);

    const accessToken = await this.authService.login(user);
    const refreshToken = await this.authService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query('me')
  async me(@Context() context) {
    return context.req.user;
  }
}
