import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ description: 'Имя пользователя', example: 'user123' })
  @IsNotEmpty({ message: 'Имя пользователя обязательно' })
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  username: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ description: 'Пароль пользователя', minLength: 6 })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;
}
