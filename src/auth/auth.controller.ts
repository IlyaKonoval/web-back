import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from './decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';

// Define an interface to extend the Express Request
interface RequestWithSession extends Request {
  session: {
    getHandle: () => string;
    getUserId: () => string;
  };
}

@ApiTags('Authentication')
@Controller('api/auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.username,
    );
  }

  @Public()
  @Post('signin')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinDto: SigninDto) {
    const user = await this.authService.signin(
      signinDto.email,
      signinDto.password,
    );
    if (user) {
      return { message: 'Login successful', user };
    }
    return { message: 'Invalid credentials' };
  }

  @Post('signout')
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @HttpCode(HttpStatus.OK)
  async signout(@Req() req: RequestWithSession) {
    await this.authService.signout(req.session.getHandle());
    return { message: 'Logout successful' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Returns user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: RequestWithSession) {
    const userId = req.session.getUserId();
    const user = await this.authService.getCurrentUser(userId);
    const roles = await this.authService.getUserRoles(userId);
    return { ...user, supertokensRoles: roles };
  }
}
