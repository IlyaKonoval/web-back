import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '../interfaces/user.interface';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'password123',
    description: 'Confirm password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
  })
  @IsString()
  @IsNotEmpty()
  username: string; // Changed from 'name' to 'username' to match other interfaces
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    enumName: 'Role',
  })
  role: Role;

  @ApiProperty({ description: 'Registration date' })
  registrationDate: Date;

  @ApiProperty({ description: 'Is guest account', default: false })
  isGuest: boolean = false;
}
