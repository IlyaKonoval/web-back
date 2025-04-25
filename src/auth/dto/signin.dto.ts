import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ description: 'Пароль пользователя' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  password: string;
}
