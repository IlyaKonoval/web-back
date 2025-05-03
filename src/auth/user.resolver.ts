import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { User } from './interfaces/user.interface';

// Define GraphQL context interface
interface GqlContext {
  req: {
    user: User;
  };
}

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

    // Remove 'await' if login is synchronous
    const accessToken = this.authService.login(user);
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

    const accessToken = this.authService.login(user);
    const refreshToken = await this.authService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query('me')
  me(@Context() context: GqlContext): User {
    // Remove async since there's no await
    return context.req.user;
  }
}
